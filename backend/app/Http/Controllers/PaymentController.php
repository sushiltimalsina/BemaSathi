<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\BuyRequest;
use App\Models\Policy;
use App\Mail\PaymentSuccessMail;
use App\Mail\PaymentFailureMail;
use App\Mail\PolicyPurchaseConfirmationMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Database\QueryException;
use Illuminate\Support\Str;
use App\Services\NotificationService;
use App\Services\LeadDistributor;
use App\Services\PremiumCalculator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Carbon;

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
    private LeadDistributor $leadDistributor;
    private PremiumCalculator $calculator;

    public function __construct(
        NotificationService $notifier,
        LeadDistributor $leadDistributor,
        PremiumCalculator $calculator
    )
    {
        $this->notifier = $notifier;
        $this->leadDistributor = $leadDistributor;
        $this->calculator = $calculator;
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
            'buy_request_id' => 'nullable|exists:buy_requests,id',
            'policy_id' => 'nullable|exists:policies,id',
            'billing_cycle'  => 'nullable|in:monthly,quarterly,half_yearly,yearly',
            'email' => 'nullable|email',
        ]);

        if (empty($data['buy_request_id']) && empty($data['policy_id'])) {
            return response()->json(['message' => 'buy_request_id or policy_id is required.'], 422);
        }

        if (!empty($data['buy_request_id'])) {
            $br = BuyRequest::with('policy')->findOrFail($data['buy_request_id']);

            if ($br->user_id !== $request->user()?->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } else {
            $br = $this->createBuyRequestFromPolicy(
                $request,
                (int) $data['policy_id'],
                $data['billing_cycle'] ?? null,
                $data['email'] ?? null
            );
        }

        $latestKyc = $request->user()?->kycDocuments()->latest()->first();
        if (!$latestKyc || $latestKyc->status !== 'approved') {
            return response()->json(['message' => 'KYC approval required before payment.'], 403);
        }
        if ($latestKyc->allow_edit) {
            return response()->json([
                'message' => 'KYC edit access granted. Please resubmit KYC before payment.'
            ], 403);
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
                'is_verified' => true,
                'verified_at' => now(),
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

        $isCancelled = (bool) ($request->query('cancelled') ?? $request->input('cancelled'));
        $status = $isCancelled ? 'cancelled' : 'failed';
        $payment->update([
            'status' => $status,
            'meta'   => ['reason' => $isCancelled ? 'User cancelled payment' : 'Payment failed', 'transaction_uuid' => $transactionUuid]
        ]);
        $this->notifyPayment($payment, $status);

        $failureRedirect = $this->frontendBase() . "/client/payment-failure?payment={$payment->id}";

        if ($request->wantsJson()) {
            return response()->json(['message' => 'Payment failed'], 400);
        }

        return redirect()->away($failureRedirect);
    }

    public function createKhalti(Request $request)
    {
        $data = $request->validate([
            'buy_request_id' => 'nullable|exists:buy_requests,id',
            'policy_id' => 'nullable|exists:policies,id',
            'billing_cycle'  => 'nullable|in:monthly,quarterly,half_yearly,yearly',
            'email' => 'nullable|email',
        ]);

        if (empty($data['buy_request_id']) && empty($data['policy_id'])) {
            return response()->json(['message' => 'buy_request_id or policy_id is required.'], 422);
        }

        if (!empty($data['buy_request_id'])) {
            $br = BuyRequest::with('policy')->findOrFail($data['buy_request_id']);

            if ($br->user_id !== $request->user()?->id) {
                return response()->json(['message' => 'Forbidden'], 403);
            }
        } else {
            $br = $this->createBuyRequestFromPolicy(
                $request,
                (int) $data['policy_id'],
                $data['billing_cycle'] ?? null,
                $data['email'] ?? null
            );
        }

        $latestKyc = $request->user()?->kycDocuments()->latest()->first();
        if (!$latestKyc || $latestKyc->status !== 'approved') {
            return response()->json(['message' => 'KYC approval required before payment.'], 403);
        }
        if ($latestKyc->allow_edit) {
            return response()->json([
                'message' => 'KYC edit access granted. Please resubmit KYC before payment.'
            ], 403);
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

            return redirect()->away($this->frontendBase() . "/client/payment-failure?payment={$payment->id}");
        }

        try {
            $payment->update([
                'status' => 'completed',
                'provider_reference' => $pidx,
                'paid_at' => now(),
                'is_verified' => true,
                'verified_at' => now(),
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

    public function cancel(Request $request, Payment $payment)
    {
        $user = $request->user();
        if ($payment->user_id !== $user?->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $normalized = strtolower((string) $payment->status);
        if (in_array($normalized, ['completed', 'success', 'paid'], true)) {
            return response()->json(['message' => 'Payment already completed.'], 409);
        }

        $payment->update([
            'status' => 'cancelled',
            'meta' => array_merge($payment->meta ?? [], ['reason' => 'User cancelled payment']),
        ]);
        $this->notifyPayment($payment, 'cancelled');

        return response()->json(['message' => 'Payment cancelled.', 'payment' => $payment]);
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

    private function resolveProfile($user): array
    {
        $kyc = $user?->kycDocuments()?->where('status', 'approved')->latest()->first();
        $dob = $user?->dob ?? $kyc?->dob;
        $age = ($dob ? Carbon::parse($dob)->age : 30);

        return [
            'age' => max(1, min(120, $age)),
            'is_smoker' => (bool) ($user?->is_smoker),
            'health_score' => $user?->health_score ?? 70,
            'coverage_type' => $user?->coverage_type ?? 'individual',
            'budget_range' => $user?->budget_range,
            'family_members' => $user?->family_members ?? 1,
        ];
    }

    private function calculateBillingInterval(string $cycle, float $basePremium): array
    {
        return match ($cycle) {
            'monthly'     => [round($basePremium / 12, 2), now()->addMonth()->toDateString()],
            'quarterly'   => [round($basePremium / 4, 2), now()->addMonths(3)->toDateString()],
            'half_yearly' => [round($basePremium / 2, 2), now()->addMonths(6)->toDateString()],
            default       => [round($basePremium, 2), now()->addYear()->toDateString()],
        };
    }

    private function createBuyRequestFromPolicy(Request $request, int $policyId, ?string $billingCycle, ?string $email): BuyRequest
    {
        $user = $request->user();
        $profile = $this->resolveProfile($user);
        $policy = Policy::findOrFail($policyId);

        $quote = $this->calculator->quote(
            $policy,
            $profile['age'],
            $profile['is_smoker'],
            $profile['health_score'],
            $profile['coverage_type'],
            $profile['budget_range'],
            $profile['family_members']
        );

        $basePremium = $quote['calculated_total'];
        $interval = $billingCycle ?? 'yearly';
        [$cycleAmount, $nextRenewal] = $this->calculateBillingInterval($interval, $basePremium);

        $latestKyc = $user?->kycDocuments()?->where('status', 'approved')->latest()->first();
        $name = $latestKyc?->full_name ?? $user?->name;
        $phone = $latestKyc?->phone ?? $user?->phone;
        $recipientEmail = $email ?: ($user?->email ?? null);

        $buyRequest = BuyRequest::create([
            'user_id' => $user?->id,
            'policy_id' => $policyId,
            'name' => $name,
            'phone' => $phone,
            'email' => $recipientEmail,
            'status' => 'pending',
            'calculated_premium' => $basePremium,
            'cycle_amount' => $cycleAmount,
            'billing_cycle' => $interval,
            'next_renewal_date' => $nextRenewal,
            'renewal_status' => 'active',
        ]);

        try {
            $this->leadDistributor->assign($buyRequest);
        } catch (\Throwable $e) {
            // ignore agent assignment failures
        }

        // Intentionally no email/notification on buy request creation.

        return $buyRequest;
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
            config('app.frontend_url')
            ?? env('APP_FRONTEND_URL')
            ?? env('FRONTEND_URL')
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
            'failed', 'cancelled' => 'Payment Failed',
            default => 'Payment Update',
        };

        $message = match ($status) {
            'completed', 'success' => "Your payment for {$policyName} was completed successfully.",
            'failed', 'cancelled' => "Your payment for {$policyName} did not complete. Please try again.",
            default => "Your payment status for {$policyName} is {$status}.",
        };

        $context = [
            'buy_request_id' => $payment->buy_request_id,
            'policy_id' => $payment->policy_id,
        ];

        $this->notifier->notify($user, $title, $message, $context);

        $recipient = $payment->buyRequest?->email ?: $user->email;
        if (!$recipient) {
            return;
        }

        try {
            if (in_array($status, ['completed', 'success'], true)) {
                Mail::to($recipient)->send(new PaymentSuccessMail($payment));
                if ($this->shouldSendPolicyDocument($payment)) {
                    Mail::to($recipient)->send(new PolicyPurchaseConfirmationMail($payment));
                }
            }

            if (in_array($status, ['failed', 'cancelled'], true)) {
                $reason = $payment->meta['reason'] ?? null;
                Mail::to($recipient)->send(new PaymentFailureMail($payment, $reason));
            }
        } catch (\Throwable $e) {
            // ignore email failures
        }
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
}
