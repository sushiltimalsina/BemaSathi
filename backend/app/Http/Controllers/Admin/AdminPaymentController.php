<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;

class AdminPaymentController extends Controller
{
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
}
