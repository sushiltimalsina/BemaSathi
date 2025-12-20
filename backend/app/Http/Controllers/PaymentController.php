<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\BuyRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;
use App\Services\NotificationService;
use App\Mail\PaymentFailureMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    private string $esewaEndpoint;
    private string $verifyEndpoint;
    private string $merchantCode;
    private string $secretKey;
    private string $environment;
    private string $khaltiBase;
    private string $khaltiSecret;
    private string $khaltiPublic;
    private NotificationService $notifier;

    public function __construct(NotificationService $notifier)
    {
        $this->notifier = $notifier;
        $merchant = config('services.esewa.merchant_code');
        $secret   = config('services.esewa.secret_key');

        // Fall back to env defaults if config cache hasn't picked up values yet
        $this->merchantCode = trim($merchant ?: env('ESEWA_MERCHANT_CODE', 'EPAYTEST'));
        $this->secretKey    = trim($secret ?: env('ESEWA_SECRET_KEY', '8gBm/:&EnhH.1/q'));

        // Default to RC v2 endpoints, which work for both test and production codes.
        $this->environment   = strtolower(env('ESEWA_ENV', 'rc'));
        $this->esewaEndpoint = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
        $this->verifyEndpoint = "https://rc-epay.esewa.com.np/api/epay/transaction/status/";

        // Khalti config (auto-pick base by key prefix if not provided)
        $this->khaltiSecret = trim(config('services.khalti.secret_key', env('KHALTI_SECRET_KEY', '')));
        $this->khaltiPublic = trim(config('services.khalti.public_key', env('KHALTI_PUBLIC_KEY', '')));

        $baseFromEnv = config('services.khalti.base_url', env('KHALTI_BASE_URL'));
        if ($baseFromEnv) {
            $base = $baseFromEnv;
        } else {
            $base = str_starts_with($this->khaltiSecret, 'live_')
                ? 'https://khalti.com/api/v2'
                : 'https://a.khalti.com/api/v2';
        }

        $this->khaltiBase = rtrim($base, '/');
    }

    public function show(Payment $payment)
    {
        $user = auth()->user();
        if ($payment->user_id !== $user?->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($payment->load('policy', 'buyRequest', 'buyRequest.policy'));
    }

    public function create(Request $request)
    {
        $data = $request->validate([
            'buy_request_id' => 'required|exists:buy_requests,id',
            'billing_cycle'  => 'nullable|in:monthly,quarterly,half_yearly,yearly',
        ]);

        $br = BuyRequest::with('policy')->findOrFail($data['buy_request_id']);

        if ($br->user_id !== $request->user()?->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $cycle = $data['billing_cycle'] ?? $br->billing_cycle;

        $amount = $this->resolveAmount($br, $cycle);

        // ensure buy request carries the latest cycle + amount
        if (!$br->cycle_amount || $cycle !== $br->billing_cycle) {
            $br->update([
                'billing_cycle' => $cycle ?? 'yearly',
                'cycle_amount'  => $amount,
            ]);
        }

        if (!$amount || $amount <= 0) {
            return response()->json(['message' => 'Invalid amount for this policy'], 422);
        }

        if (!$this->merchantCode || !$this->secretKey) {
            return response()->json(['message' => 'Payment gateway configuration missing.'], 500);
        }

        // Create payment entry
        $payment = Payment::create([
            'user_id'       => $br->user_id,
            'policy_id'     => $br->policy_id,
            'buy_request_id'=> $br->id,
            'amount'        => $amount,
            'currency'      => 'NPR',
            'method'        => 'esewa',
            'provider'      => 'eSewa',
            'status'        => 'pending',
            'meta'          => [
                'transaction_uuid' => (string) Str::uuid(),
            ],
        ]);

        $payload = $this->buildEsewaPayload($payment);

        return response()->json([
            'payment_id' => $payment->id,
            'redirect_url' => $this->esewaEndpoint,
            'payload' => $payload,
        ]);
    }

    public function success(Request $request, Payment $payment)
    {
        // eSewa may send a base64 encoded data blob containing transaction fields
        $transactionUuid = $this->extractTransactionUuid($request, $payment);

        if (!$transactionUuid) {
            return response()->json(['message' => 'Missing transaction reference'], 400);
        }

        // VERIFY TRANSACTION (eSewa ePay v2 for both UAT and RC)
        $verify = Http::get($this->verifyEndpoint, [
            'product_code'     => $this->merchantCode,
            'transaction_uuid' => $transactionUuid,
            'total_amount'     => $payment->amount,
        ]);

        $status = $verify->json('status');
        if (!$verify->ok() || $status !== 'COMPLETE') {
            return response()->json(['message' => 'Verification failed', 'gateway_status' => $status], 400);
        }

        // Update payment
        try {
            $payment->update([
                'status' => 'completed',
                'provider_reference' => $transactionUuid,
                'paid_at' => now(),
            ]);
            $this->notifyPayment($payment, 'completed');
        } catch (QueryException $e) {
            // If status enum mismatches existing schema, keep flow moving and continue to redirect
        }

        // Mark BuyRequest as Completed (best effort)
        try {
            $payment->buyRequest?->update(['status' => 'completed']);
        } catch (QueryException $e) {
            // Ignore and continue redirect
        }

        $successRedirect = $this->frontendBase() . "/client/payment-success?payment={$payment->id}";

        if ($request->wantsJson()) {
            return response()->json([
                'message' => 'Payment successful',
                'payment' => $payment
            ]);
        }

        return redirect()->away($successRedirect);
    }

    public function failed(Request $request, Payment $payment)
    {
        $transactionUuid = $payment->meta['transaction_uuid']
            ?? $request->query('transaction_uuid')
            ?? $request->input('transaction_uuid');

        $payment->update([
            'status' => 'failed',
            'meta'   => ['reason' => 'User cancelled or payment rejected', 'transaction_uuid' => $transactionUuid]
        ]);
        $this->notifyPayment($payment, 'failed');

        $this->sendPaymentFailureEmail($payment, 'User cancelled or payment rejected');

        $failureRedirect = $this->frontendBase() . "/client/payment-failure?payment={$payment->id}";

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Payment failed'], 400);
        }

        return redirect()->away($failureRedirect);
    }

    public function createKhalti(Request $request)
    {
        $data = $request->validate([
            'buy_request_id' => 'required|exists:buy_requests,id',
            'billing_cycle'  => 'nullable|in:monthly,quarterly,half_yearly,yearly',
        ]);

        $br = BuyRequest::with('policy')->findOrFail($data['buy_request_id']);

        if ($br->user_id !== $request->user()?->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $cycle = $data['billing_cycle'] ?? $br->billing_cycle;
        $amount = $this->resolveAmount($br, $cycle);

        if (!$br->cycle_amount || $cycle !== $br->billing_cycle) {
            $br->update([
                'billing_cycle' => $cycle ?? 'yearly',
                'cycle_amount'  => $amount,
            ]);
        }

        if (!$amount || $amount <= 0) {
            return response()->json(['message' => 'Invalid amount for this policy'], 422);
        }

        if (!$this->khaltiSecret || !$this->khaltiBase) {
            return response()->json(['message' => 'Khalti configuration missing.'], 500);
        }

        $payment = Payment::create([
            'user_id'       => $br->user_id,
            'policy_id'     => $br->policy_id,
            'buy_request_id'=> $br->id,
            'amount'        => $amount,
            'currency'      => 'NPR',
            'method'        => 'khalti',
            'provider'      => 'Khalti',
            'status'        => 'pending',
        ]);

        $payload = [
            'return_url'         => url("/api/payments/khalti/return/{$payment->id}"),
            'website_url'        => $this->frontendBase(),
            'amount'             => (int) round($amount * 100), // paisa
            'purchase_order_id'  => (string) $payment->id,
            'purchase_order_name'=> $br->policy?->policy_name ?? 'Policy Purchase',
            'customer_info'      => [
                'name'  => $br->name,
                'email' => $br->email ?: $request->user()?->email,
                'phone' => $br->phone,
            ],
        ];

        $resp = Http::withHeaders([
            'Authorization' => 'Key ' . $this->khaltiSecret,
            'Accept'        => 'application/json',
            'Content-Type'  => 'application/json',
        ])->asJson()->post("{$this->khaltiBase}/epayment/initiate/", $payload);

        if (!$resp->ok() || !$resp->json('payment_url')) {
            $payment->update([
                'status' => 'failed',
                'meta' => [
                    'reason'   => 'khalti_initiate_failed',
                    'response' => $resp->json(),
                ],
            ]);
            return response()->json([
                'message' => $resp->json('detail') ?? $resp->json('message') ?? 'Unable to initiate Khalti payment.',
                'errors'  => $resp->json(),
            ], 502);
        }

        $pidx = $resp->json('pidx');
        $payment->update([
            'provider_reference' => $pidx,
            'meta' => array_merge($payment->meta ?? [], [
                'pidx' => $pidx,
                'khalti_init' => $resp->json(),
            ]),
        ]);

        return response()->json([
            'payment_id'  => $payment->id,
            'payment_url' => $resp->json('payment_url'),
            'pidx'        => $pidx,
            'return_url'  => $payload['return_url'],
        ]);
    }

    public function khaltiReturn(Request $request, Payment $payment)
    {
        $pidx = $request->query('pidx') ?? $request->input('pidx') ?? $payment->meta['pidx'] ?? $payment->provider_reference;

        if (!$pidx) {
            return response()->json(['message' => 'Missing pidx'], 400);
        }

        $lookup = Http::withHeaders([
            'Authorization' => 'Key ' . $this->khaltiSecret,
            'Accept'        => 'application/json',
        ])->post("{$this->khaltiBase}/epayment/lookup/", ['pidx' => $pidx]);

        $status = $lookup->json('status');

        if (!$lookup->ok() || $status !== 'Completed') {
            $payment->update([
                'status' => 'failed',
                'meta'   => array_merge($payment->meta ?? [], ['pidx' => $pidx, 'khalti_status' => $status]),
            ]);
            $this->notifyPayment($payment, 'failed');
            $this->sendPaymentFailureEmail($payment, $status ?: 'Khalti verification failed');

            return redirect()->away($this->frontendBase() . "/client/payment-failure?payment={$payment->id}");
        }

        try {
            $payment->update([
                'status' => 'completed',
                'provider_reference' => $pidx,
                'paid_at' => now(),
                'meta' => array_merge($payment->meta ?? [], ['pidx' => $pidx, 'khalti_status' => $status]),
            ]);
            $this->notifyPayment($payment, 'completed');
        } catch (QueryException $e) {
            // ignore
        }

        try {
            $payment->buyRequest?->update(['status' => 'completed']);
        } catch (QueryException $e) {
            // ignore
        }

        return redirect()->away($this->frontendBase() . "/client/payment-success?payment={$payment->id}");
    }

    /**
     * Return authenticated user's payments with related policy + buy request.
     */
    public function myPayments(Request $request)
    {
        $payments = Payment::with([
            'buyRequest.policy',
        ])
            ->where('user_id', $request->user()?->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($payments);
    }

    private function buildEsewaPayload(Payment $payment): array
    {
        // Use plain numeric string (no thousands separator) so gateway amount matches cycle charge
        $amount = number_format($payment->amount, 2, '.', '');

        $transactionUuid = $payment->meta['transaction_uuid'] ?? (string) Str::uuid();

        $payload = [
            'amount'                  => $amount,
            'tax_amount'              => 0,
            'total_amount'            => $amount,
            'transaction_uuid'        => $transactionUuid,
            'product_code'            => $this->merchantCode,
            'product_service_charge'  => 0,
            'product_delivery_charge' => 0,
            'success_url'             => url("/api/payments/{$payment->id}/success"),
            'failure_url'             => url("/api/payments/{$payment->id}/failed"),
            'signed_field_names'      => 'total_amount,transaction_uuid,product_code',
            // explicit fields eSewa expects for UI amount display
            'amount_breakdown'        => [
                'actual_amount' => $amount,
                'display_amount'=> $amount,
            ],
        ];

        $signatureString = "total_amount={$payload['total_amount']},transaction_uuid={$payload['transaction_uuid']},product_code={$payload['product_code']}";
        $payload['signature'] = base64_encode(hash_hmac('sha256', $signatureString, $this->secretKey, true));

        return $payload;
    }

    /**
     * Safely resolve payable amount using cycle_amount or billing_cycle.
     */
    private function resolveAmount(BuyRequest $br, ?string $overrideCycle = null): float
    {
        if ($br->cycle_amount) {
            return (float) $br->cycle_amount;
        }

        $base = $br->calculated_premium ?? $br->policy?->premium_amt ?? 0;
        $cycle = $overrideCycle ?? $br->billing_cycle ?? 'yearly';

        return match ($cycle) {
            'monthly'     => round($base / 12, 2),
            'quarterly'   => round($base / 4, 2),
            'half_yearly' => round($base / 2, 2),
            default       => (float) $base,
        };
    }

    /**
     * Extract transaction UUID from query/body or encoded "data" blob.
     */
    private function extractTransactionUuid(Request $request, Payment $payment): ?string
    {
        $direct = $payment->meta['transaction_uuid']
            ?? $request->query('transaction_uuid')
            ?? $request->input('transaction_uuid')
            ?? $request->query('refId')
            ?? $request->input('refId');

        if ($direct) {
            return $direct;
        }

        $encoded = $request->query('data') ?? $request->input('data');
        if (!$encoded) {
            return null;
        }

        $decoded = base64_decode($encoded, true);
        if (!$decoded) {
            return null;
        }

        $payload = json_decode($decoded, true);
        if (!is_array($payload)) {
            return null;
        }

        return $payload['transaction_uuid'] ?? $payload['transaction_uuId'] ?? $payload['transaction_uuid'] ?? null;
    }

    /**
     * Resolve frontend base URL for redirects, favoring env every time to avoid stale config cache.
     */
    private function frontendBase(): string
    {
        return rtrim(
            env('APP_FRONTEND_URL')
            ?? env('FRONTEND_URL')
            ?? config('app.frontend_url')
            ?? config('app.url')
            ?? url('/'),
            '/'
        );
    }

    /**
     * Notify user about payment status changes.
     */
    private function notifyPayment(Payment $payment, string $status): void
    {
        $payment->loadMissing('user', 'policy', 'buyRequest.policy');
        $user = $payment->user;
        if (!$user) {
            return;
        }

        $policyName = $payment->policy?->policy_name
            ?? $payment->buyRequest?->policy?->policy_name
            ?? 'your policy';

        $title = match ($status) {
            'completed', 'success' => 'Payment Completed',
            'failed' => 'Payment Failed',
            default => 'Payment Update',
        };

        $message = match ($status) {
            'completed', 'success' => "Your payment for {$policyName} was completed successfully.",
            'failed' => "Your payment for {$policyName} did not complete. Please try again.",
            default => "Your payment status for {$policyName} is {$status}.",
        };

        $context = [
            'buy_request_id' => $payment->buy_request_id,
            'policy_id' => $payment->policy_id,
        ];

        $this->notifier->notify($user, $title, $message, $context, 'system', false);
    }

    private function sendPaymentFailureEmail(Payment $payment, ?string $reason = null): void
    {
        $payment->loadMissing('user', 'policy', 'buyRequest.policy');
        $user = $payment->user;
        if (!$user || !$user->email) {
            return;
        }

        if ($payment->failed_notified) {
            return;
        }

        try {
            Mail::to($user->email)->send(new PaymentFailureMail($payment, $reason));
            $payment->failed_notified = true;
            $payment->failed_notified_at = now();
            $payment->save();
        } catch (\Throwable $e) {
            Log::warning('Failed sending payment failure email', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
