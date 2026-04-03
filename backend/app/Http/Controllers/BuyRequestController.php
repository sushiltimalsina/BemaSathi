<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BuyRequest;
use App\Models\PaymentIntent;
use App\Models\Policy;
use App\Services\PremiumCalculator;
use Illuminate\Support\Carbon;

class BuyRequestController extends Controller
{
    use \App\Traits\SyncsPolicyStatus;
    use \App\Traits\HandlesInsuranceQuotes;

    public function __construct(private PremiumCalculator $calculator) {}

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'name'      => 'required|string|max:255',
            'phone'     => 'required|string|max:20',
            'email'     => 'nullable|email',
            'billing_cycle' => 'nullable|in:monthly,quarterly,half_yearly,yearly'
        ]);

        // KYC must be approved
        $latestKyc = $user->kycDocuments()->latest()->first();
        if (!$latestKyc || $latestKyc->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'KYC approval required before submitting a request.'
            ], 403);
        }
        if ($latestKyc->allow_edit) {
            return response()->json([
                'success' => false,
                'message' => 'KYC edit access granted. Please resubmit KYC before submitting a request.'
            ], 403);
        }

        $data['name'] = $latestKyc?->full_name ?? $user->name;
        $data['phone'] = $latestKyc?->phone ?? $user->phone;

        $profile = $this->resolveStandardProfile($user);
        $policy = Policy::findOrFail($data['policy_id']);

        $basePremium = $this->getPersonalizedPremium(
            $this->calculator,
            $policy,
            $profile
        );
        $interval = $data['billing_cycle'] ?? 'yearly';
        [$cycleAmount, $nextRenewal] = $this->calculateBillingInterval($interval, $basePremium);

        $data['user_id'] = $user->id;
        $data['calculated_premium'] = $basePremium;
        $data['cycle_amount']      = $cycleAmount;
        $data['billing_cycle']     = $interval;
        $data['next_renewal_date'] = $nextRenewal;
        $data['renewal_status']    = 'active';

        $intent = PaymentIntent::create([
            'user_id' => $data['user_id'],
            'policy_id' => $data['policy_id'],
            'email' => $data['email'] ?? $user?->email,
            'name' => $data['name'],
            'phone' => $data['phone'],
            'billing_cycle' => $interval,
            'calculated_premium' => $basePremium,
            'cycle_amount' => $cycleAmount,
            'amount' => $cycleAmount,
            'currency' => 'NPR',
            'next_renewal_date' => $nextRenewal,
            'renewal_status' => 'active',
            'status' => 'pending',
            'expires_at' => now()->addDay(),
        ]);

        $msg = 'Request prepared. Proceed to payment.';

        return response()->json([
            'success' => true,
            'message' => $msg,
            'payment_intent_id' => $intent->id,
            'premium' => $intent->cycle_amount,
            'billing_cycle' => $interval,
            'next_renewal_date' => $nextRenewal
        ]);
    }

    /**
     * List authenticated user's buy requests with policy + renewal data.
     */
    public function userRequests(Request $request)
    {
        $user = $request->user();

        if ($user) {
            $this->syncPolicyStatuses($user->id);
        }

        $requests = BuyRequest::with(['policy', 'policy.agents', 'policy.agents.company'])
            ->where('user_id', $user?->id)
            ->whereHas('payments', function ($query) {
                $query->where('is_verified', true)
                    ->whereIn('status', ['success', 'paid', 'completed']);
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json($requests);
    }

    /**
     * Get a specific buy request for the authenticated user.
     */
    public function show(Request $request, BuyRequest $buyRequest)
    {
        if ($buyRequest->user_id !== $request->user()?->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $buyRequest->load('policy');

        return response()->json($buyRequest);
    }

    public function policyDocument(BuyRequest $buyRequest)
    {
        if ($buyRequest->user_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $buyRequest->loadMissing(['payments', 'user', 'policy']);

        $payment = $buyRequest->payments()->where('is_verified', true)->first();
        if (!$payment) {
            return response()->json(['message' => 'No verified payment found for this request'], 404);
        }

        // Logic reused from AdminBuyRequestController for consistency
        $policy = $payment->policy ?? $buyRequest->policy;
        $user = $payment->user;
        $kyc = $user?->kycDocuments()?->where('status', 'approved')->latest()->first();
        $recipientEmail = $buyRequest->email ?? $user?->email;
        $policyNumber = 'BS-' . str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT);
        $tz = 'Asia/Kathmandu';
        $effectiveDate = \Illuminate\Support\Carbon::parse($payment->verified_at ?? $payment->paid_at ?? now())->timezone($tz);

        $premiumAmount = $buyRequest->cycle_amount ?? $payment->amount ?? 0;

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.policy-document', [
            'policyNumber' => $policyNumber,
            'policyName' => $policy?->policy_name ?? 'Policy',
            'companyName' => $policy?->company_name ?? 'Insurance Company',
            'insuranceType' => $policy?->insurance_type ?? 'Medical',
            'coverageLimit' => $policy?->coverage_limit ?? 'N/A',
            'premium' => $premiumAmount,
            'billingCycle' => $buyRequest->billing_cycle ?? 'yearly',
            'effectiveDate' => $effectiveDate,
            'nextRenewalDate' => $buyRequest->next_renewal_date,
            'policyDescription' => $policy?->policy_description ?? '',
            'coveredConditions' => $policy?->covered_conditions ?? [],
            'exclusions' => $policy?->exclusions ?? [],
            'waitingPeriodDays' => $policy?->waiting_period_days ?? 0,
            'copayPercent' => $policy?->copay_percent ?? 0,
            'claimSettlementRatio' => $policy?->claim_settlement_ratio ?? 0,
            'supportsSmokers' => $policy?->supports_smokers ?? false,
            'userName' => $kyc?->full_name ?? $user?->name ?? 'Policy Holder',
            'userEmail' => $recipientEmail ?? 'N/A',
            'userPhone' => $kyc?->phone ?? $user?->phone ?? 'N/A',
            'userAddress' => $kyc?->address ?? $user?->address ?? 'N/A',
            'userDob' => $kyc?->dob ?? $user?->dob,
            'userDocumentNumber' => $kyc?->document_number ?? 'N/A',
            'userOccupation' => $user?->occupation_class,
            'userBmi' => $this->calculateBmi($user),
            'userSmoker' => $user?->is_smoker,
            'paymentType' => 'new',
            'healthDeclaration' => $buyRequest->health_declaration ?? $payment->paymentIntent?->health_declaration ?? $payment->paymentIntent?->meta['health_declaration'] ?? null,
            'taxAmount' => round($premiumAmount * 0.13, 2),
            'subtotal' => round($premiumAmount / 1.13, 2),
        ]);

        return $pdf->download("policy-{$policyNumber}.pdf");
    }

    public function paymentReceipt(BuyRequest $buyRequest)
    {
        if ($buyRequest->user_id !== auth()->id()) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $buyRequest->loadMissing(['payments', 'user', 'policy']);

        $payment = $buyRequest->payments()->where('is_verified', true)->latest()->first();
        
        $policy = $payment->policy ?? $buyRequest->policy;
        $user = $payment->user ?? auth()->user();
        $recipientEmail = $buyRequest->email ?? $user?->email;
        $billingCycle = $buyRequest->billing_cycle ?? 'yearly';
        
        // Use payment data if available, otherwise fallback to request data for localhost testing
        $transactionId = $payment ? ($payment->provider_reference ?? ($payment->meta['transaction_uuid'] ?? (string) $payment->id)) : 'PENDING-' . $buyRequest->id;
        $tz = 'Asia/Kathmandu';
        $paidAt = \Illuminate\Support\Carbon::parse(($payment ? ($payment->verified_at ?? $payment->paid_at) : $buyRequest->created_at) ?? now())->timezone($tz);
        $receiptNumber = $payment ? ('RCPT-' . str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT)) : ('REQ-' . str_pad((string) $buyRequest->id, 6, '0', STR_PAD_LEFT));
        
        $policyNumber = 'BS-PENDING';
        if ($payment) {
            $firstPayment = $buyRequest->payments()->where('is_verified', true)->orderBy('created_at', 'asc')->first();
            $policyNumber = 'BS-' . str_pad((string) ($firstPayment?->id ?? $payment->id), 6, '0', STR_PAD_LEFT);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.payment-receipt', [
            'receiptNumber' => $receiptNumber,
            'policyNumber' => $policyNumber,
            'transactionId' => $transactionId,
            'amount' => $payment ? $payment->amount : $buyRequest->cycle_amount,
            'currency' => $payment ? ($payment->currency ?? 'NPR') : 'NPR',
            'paidAt' => $paidAt,
            'paidAtText' => $paidAt->format('M j, Y g:i A') . ($payment ? " (NPT)" : " (Preliminary)"),
            'policyName' => $policy?->policy_name ?? 'Policy',
            'companyName' => $policy?->company_name ?? 'Insurance Company',
            'billingCycle' => $billingCycle ?? 'yearly',
            'userName' => $user?->name ?? 'Customer',
            'userEmail' => $recipientEmail ?? 'N/A',
            'nextRenewalDate' => $buyRequest->next_renewal_date,
            'nextRenewalDateText' => $buyRequest->next_renewal_date ? \Illuminate\Support\Carbon::parse($buyRequest->next_renewal_date)->format('M j, Y') . " (NPT)" : null,
            'paymentType' => $payment ? 'verified' : 'pending',
        ]);

        return $pdf->download("receipt-{$receiptNumber}.pdf");
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


    public function preview(Request $request)
{
    $user = auth()->user();

    $data = $request->validate([
        'policy_id' => 'required|exists:policies,id',
        'billing_cycle' => 'required|in:monthly,quarterly,half_yearly,yearly'
    ]);

    $policy = Policy::findOrFail($data['policy_id']);
    $profile = $this->resolveStandardProfile($user);

    $basePremium = $this->getPersonalizedPremium(
        $this->calculator,
        $policy,
        $profile
    );

    [$cycleAmount, $nextRenewal] = $this->calculateBillingInterval(
        $data['billing_cycle'],
        $basePremium
    );

    return response()->json([
        'success' => true,
        'base_premium' => $basePremium,
        'cycle_amount' => $cycleAmount,
        'billing_cycle' => $data['billing_cycle'],
        'next_renewal_date' => $nextRenewal
    ]);
}

    private function calculateBmi($user): string
    {
        if (!$user || !$user->weight_kg || !$user->height_cm) {
            return 'N/A';
        }

        $heightM = $user->height_cm / 100;
        $bmi = $user->weight_kg / ($heightM * $heightM);
        
        return number_format($bmi, 1);
    }

}
