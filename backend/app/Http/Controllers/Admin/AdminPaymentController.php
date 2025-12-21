<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use App\Mail\PaymentFailureMail;
use App\Mail\PaymentSuccessMail;
use App\Mail\PolicyPurchaseConfirmationMail;
use App\Models\Payment as PaymentModel;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AdminPaymentController extends Controller
{
    private NotificationService $notifier;

    public function __construct(NotificationService $notifier)
    {
        $this->notifier = $notifier;
    }

    public function index()
    {
        $payments = Payment::with(['user', 'buyRequest.policy'])
            ->orderByDesc('created_at')
            ->get();

        $mapped = $payments->map(function (Payment $payment) {
            $payment->payment_method = $payment->method;
            $payment->transaction_id = $payment->provider_reference ?? ($payment->meta['transaction_uuid'] ?? null);
            $payment->billing_cycle = optional($payment->buyRequest)->billing_cycle ?? $payment->billing_cycle;
            return $payment;
        });

        return response()->json($mapped);
    }

    public function verify(Request $request, Payment $payment)
    {
        $status = strtolower((string) $payment->status);
        $isSuccess = in_array($status, ['success', 'paid', 'completed'], true);

        $payment->load(['user', 'buyRequest.policy']);
        $policyName = optional(optional($payment->buyRequest)->policy)->policy_name ?? 'your policy';

        if (!$isSuccess) {
            if ($payment->user) {
                $reason = $payment->meta['reason'] ?? null;
                $reasonText = $reason ? " Reason: {$reason}" : '';
                $this->notifier->notify(
                    $payment->user,
                    'Payment failed',
                    "Your payment for {$policyName} failed. Please repay to continue your coverage.{$reasonText}",
                    [
                        'buy_request_id' => $payment->buy_request_id,
                        'policy_id' => $payment->policy_id,
                    ],
                    'system',
                    false
                );

                if (!$payment->failed_notified && $payment->user->email) {
                    try {
                        Mail::to($payment->user->email)->send(new PaymentFailureMail($payment, $reason));
                        $payment->failed_notified = true;
                        $payment->failed_notified_at = now();
                    } catch (\Throwable $e) {
                        Log::warning('Failed sending admin payment failure email', [
                            'payment_id' => $payment->id,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }

            $payment->failed_notified = true;
            $payment->failed_notified_at = now();
            $payment->save();

            return response()->json([
                'message' => 'Payment failure notice sent.',
                'payment' => $payment,
            ]);
        }

        if ($payment->is_verified) {
            return response()->json([
                'message' => 'Payment already verified.',
                'payment' => $payment,
            ]);
        }

        $payment->is_verified = true;
        $payment->verified_at = now();
        $payment->save();

        if ($payment->buyRequest) {
            $billingCycle = $payment->buyRequest->billing_cycle
                ?? $payment->billing_cycle
                ?? 'yearly';

            $anchor = PaymentModel::where('buy_request_id', $payment->buy_request_id)
                ->where('is_verified', true)
                ->orderByRaw('COALESCE(verified_at, paid_at, created_at) asc')
                ->first();

            $anchorDate = $anchor
                ? Carbon::parse($anchor->verified_at ?? $anchor->paid_at ?? $anchor->created_at)
                : Carbon::parse($payment->buyRequest->created_at);

            $verifiedCount = PaymentModel::where('buy_request_id', $payment->buy_request_id)
                ->where('is_verified', true)
                ->count();

            $nextRenewal = match ($billingCycle) {
                'monthly' => $anchorDate->copy()->addMonths($verifiedCount)->toDateString(),
                'quarterly' => $anchorDate->copy()->addMonths($verifiedCount * 3)->toDateString(),
                'half_yearly' => $anchorDate->copy()->addMonths($verifiedCount * 6)->toDateString(),
                default => $anchorDate->copy()->addYears($verifiedCount)->toDateString(),
            };

            $payment->buyRequest->next_renewal_date = $nextRenewal;
            $payment->buyRequest->renewal_status = 'active';
            $payment->buyRequest->save();
        }

        if ($payment->user) {
            $this->notifier->notify(
                $payment->user,
                'Payment verified',
                "Your payment for {$policyName} has been verified. Your policy is now active and policy documents will be sent to you shortly via email.",
                [
                    'buy_request_id' => $payment->buy_request_id,
                    'policy_id' => $payment->policy_id,
                ],
                'system',
                false
            );

            if ($payment->user->email) {
                try {
                    Mail::to($payment->user->email)->send(new PaymentSuccessMail($payment));
                    if (($payment->payment_type ?? 'new') === 'new') {
                        Mail::to($payment->user->email)->send(new PolicyPurchaseConfirmationMail($payment));
                    }
                } catch (\Throwable $e) {
                    Log::warning('Failed sending payment verification emails', [
                        'payment_id' => $payment->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Payment verified.',
            'payment' => $payment,
        ]);
    }
}
