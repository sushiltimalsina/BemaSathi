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

}
