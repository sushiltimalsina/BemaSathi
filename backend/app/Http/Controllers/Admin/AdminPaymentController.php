<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\PaymentFailureMail;
use App\Mail\PaymentSuccessMail;
use App\Mail\PolicyPurchaseConfirmationMail;
use App\Models\Payment;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

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
            if ($payment->buy_request_id) {
                $otherVerified = Payment::where('buy_request_id', $payment->buy_request_id)
                    ->where('is_verified', true)
                    ->where('id', '!=', $payment->id)
                    ->exists();
                $payment->payment_type = $otherVerified ? 'renewal' : 'new';
            } else {
                $payment->payment_type = 'new';
            }
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

        $recipient = $payment->buyRequest?->email ?: $payment->user?->email;

        if (!$isSuccess) {
            $notifyUser = $payment->user ?? $payment->buyRequest?->user;
            if ($notifyUser) {
                $this->notifier->notify(
                    $notifyUser,
                    'Payment failed',
                    "Your payment for {$policyName} failed. Please repay to continue your coverage.",
                    [
                        'buy_request_id' => $payment->buy_request_id,
                        'policy_id' => $payment->policy_id,
                    ],
                    'payment',
                    false
                );
            }
            if ($recipient) {
                try {
                    $reason = $payment->meta['reason'] ?? null;
                    Mail::to($recipient)->send(new PaymentFailureMail($payment, $reason));
                } catch (\Throwable $e) {
                    \Log::warning('Payment failure email send failed', [
                        'payment_id' => $payment->id,
                        'recipient' => $recipient,
                        'error' => $e->getMessage(),
                    ]);
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
        $this->updateRenewalAfterVerification($payment);

        $notifyUser = $payment->user ?? $payment->buyRequest?->user;
        if ($notifyUser) {
            $this->notifier->notify(
                $notifyUser,
                'Payment verified',
                "Your payment for {$policyName} is verified. Please find the policy document and receipt in your email.",
                [
                    'buy_request_id' => $payment->buy_request_id,
                    'policy_id' => $payment->policy_id,
                ],
                'payment',
                false
            );
        }
        if ($recipient) {
            try {
                Mail::to($recipient)->send(new PaymentSuccessMail($payment));
                if ($this->shouldSendPolicyDocument($payment)) {
                    Mail::to($recipient)->send(new PolicyPurchaseConfirmationMail($payment));
                }
            } catch (\Throwable $e) {
                // ignore email failures
            }
        }

        return response()->json([
            'message' => 'Payment verified.',
            'payment' => $payment,
        ]);
    }

    private function shouldSendPolicyDocument(Payment $payment): bool
    {
        if (!$payment->buy_request_id) {
            return false;
        }

        $otherVerified = Payment::where('buy_request_id', $payment->buy_request_id)
            ->where('is_verified', true)
            ->where('id', '!=', $payment->id)
            ->exists();

        return !$otherVerified;
    }

    private function updateRenewalAfterVerification(Payment $payment): void
    {
        $buyRequest = $payment->buyRequest;
        if (!$buyRequest) {
            return;
        }

        $otherVerified = Payment::where('buy_request_id', $buyRequest->id)
            ->where('is_verified', true)
            ->where('id', '!=', $payment->id)
            ->exists();

        if (!$otherVerified) {
            return;
        }

        $cycle = $buyRequest->billing_cycle ?? 'yearly';
        $baseDate = $buyRequest->next_renewal_date
            ? \Illuminate\Support\Carbon::parse($buyRequest->next_renewal_date)
            : now();
        $start = $baseDate->greaterThan(now()) ? $baseDate : now();

        $next = match ($cycle) {
            'monthly' => $start->copy()->addMonth(),
            'quarterly' => $start->copy()->addMonths(3),
            'half_yearly' => $start->copy()->addMonths(6),
            default => $start->copy()->addYear(),
        };

        $buyRequest->update([
            'next_renewal_date' => $next->toDateString(),
            'renewal_status' => 'active',
        ]);
    }
}
