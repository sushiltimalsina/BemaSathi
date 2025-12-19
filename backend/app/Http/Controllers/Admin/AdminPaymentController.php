<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\NotificationService;
use Illuminate\Http\Request;

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
                $this->notifier->notify(
                    $payment->user,
                    'Payment failed',
                    "Your payment for {$policyName} failed. Please repay to continue your coverage.",
                    [
                        'buy_request_id' => $payment->buy_request_id,
                        'policy_id' => $payment->policy_id,
                    ]
                );
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

        if ($payment->user) {
            $this->notifier->notify(
                $payment->user,
                'Payment verified',
                "Your payment for {$policyName} has been verified. Your policy is now active.",
                [
                    'buy_request_id' => $payment->buy_request_id,
                    'policy_id' => $payment->policy_id,
                ]
            );
        }

        return response()->json([
            'message' => 'Payment verified.',
            'payment' => $payment,
        ]);
    }
}
