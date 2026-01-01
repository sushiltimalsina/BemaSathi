<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BuyRequest;
use App\Models\Policy;
use App\Services\LeadDistributor;
use App\Services\NotificationService;
use App\Services\PremiumCalculator;
use Illuminate\Support\Carbon;

class BuyRequestController extends Controller
{
    public function __construct(
        private LeadDistributor $leadDistributor,
        private NotificationService $notifier,
        private PremiumCalculator $calculator
    ) {}

    /**
     * Create Buy Request with billing cycle + premium calculation
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'policy_id'      => 'required|exists:policies,id',
            'name'           => 'required|string|max:255',
            'phone'          => 'required|string|max:20',
            'email'          => 'nullable|email',
            'billing_cycle'  => 'required|in:monthly,quarterly,half_yearly,yearly'
        ]);

        // KYC must be approved
        $latestKyc = $user->kycDocuments()->latest()->first();
        if (!$latestKyc || $latestKyc->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'KYC approval required before submitting a request.'
            ], 403);
        }

        // Load user profile values
        $profile = $this->resolveProfile($user);
        $policy  = Policy::findOrFail($data['policy_id']);

        // Base premium determined by algorithm
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

        // Calculate interval charges
        $interval = $data['billing_cycle'];
        [$cycleAmount, $nextRenewal] = $this->calculateBillingInterval($interval, $basePremium);

        $data['user_id']            = $user->id;
        $data['status']             = 'pending';
        $data['calculated_premium'] = $basePremium;     // yearly base premium
        $data['cycle_amount']       = $cycleAmount;      // what user pays now
        $data['next_renewal_date']  = $nextRenewal;
        $data['renewal_status']     = 'active';

        $buyRequest = BuyRequest::create($data);

        // Assign agent
        $assignedAgent = $this->leadDistributor->assign($buyRequest);

        $msg = $assignedAgent
            ? 'Request submitted and assigned to an agent.'
            : 'Request submitted successfully.';

        // Notify user
        $this->notifier->notify($user, 'Buy Request Submitted', $msg, [
            'buy_request_id' => $buyRequest->id
        ]);

        return response()->json([
            'success' => true,
            'message' => $msg,
            'buy_request_id' => $buyRequest->id,
            'premium' => $buyRequest->cycle_amount, // amount user will actually pay
            'billing_cycle' => $interval,
            'next_renewal_date' => $buyRequest->next_renewal_date
        ]);
    }


    /**
     * Calculate billing interval amounts & renewal dates
     */
    private function calculateBillingInterval(string $cycle, float $basePremium): array
    {
        switch ($cycle) {

            case 'monthly':
                $amount = $basePremium / 12;
                $renew  = now()->addMonth();
                break;

            case 'quarterly':
                $amount = $basePremium / 4;
                $renew  = now()->addMonths(3);
                break;

            case 'half_yearly':
                $amount = $basePremium / 2;
                $renew  = now()->addMonths(6);
                break;

            case 'yearly':
            default:
                $amount = $basePremium;
                $renew  = now()->addYear();
                break;
        }

        return [round($amount, 2), $renew->toDateString()];
    }


    /**
     * Resolves user's insurance profile for premium calculation
     */
    private function resolveProfile($user)
    {
        $kyc = $user->kycDocuments()->where('status', 'approved')->latest()->first();

        $dob = $kyc?->dob ?? $user->dob;
        $age = ($dob ? Carbon::parse($dob)->age : 30);

        return [
            'age'            => max(1, min(120, $age)),
            'is_smoker'      => (bool)$user->is_smoker,
            'health_score'   => $user->health_score ?? 70,
            'coverage_type'  => $user->coverage_type ?? 'individual',
            'budget_range'   => $user->budget_range,
            'family_members' => $user->family_members ?? 1
        ];
    }
}
