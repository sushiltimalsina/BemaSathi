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

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'name'      => 'required|string|max:255',
            'phone'     => 'required|string|max:20',
            'email'     => 'nullable|email'
        ]);

        // KYC must be approved
        $latestKyc = $user->kycDocuments()->latest()->first();
        if (!$latestKyc || $latestKyc->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'KYC approval required before submitting a request.'
            ], 403);
        }

        $profile = $this->resolveProfile($user);
        $policy = Policy::findOrFail($data['policy_id']);

        $quote = $this->calculator->quote(
            $policy,
            $profile['age'],
            $profile['is_smoker'],
            $profile['health_score'],
            $profile['coverage_type'],
            $profile['budget_range']
        );

        $data['user_id'] = $user->id;
        $data['status']  = 'pending';
        $data['calculated_premium'] = $quote['calculated_total'];

        $buyRequest = BuyRequest::create($data);

        // Assign agent
        $assignedAgent = $this->leadDistributor->assign($buyRequest);

        $msg = $assignedAgent
            ? 'Request submitted and assigned to an agent.'
            : 'Request submitted successfully.';

        $this->notifier->notify($user, 'Buy Request Submitted', $msg, [
            'buy_request_id' => $buyRequest->id
        ]);

        return response()->json([
            'success' => true,
            'message' => $msg,
            'buy_request_id' => $buyRequest->id,
            'premium' => $buyRequest->calculated_premium
        ]);
    }


    private function resolveProfile($user)
    {
        $kyc = $user->kycDocuments()->where('status', 'approved')->latest()->first();

        $dob = $kyc?->dob ?? $user->dob;
        $age = ($dob ? Carbon::parse($dob)->age : 30);

        return [
            'age' => max(1, min(120, $age)),
            'is_smoker' => (bool)$user->is_smoker,
            'health_score' => $user->health_score ?? 70,
            'coverage_type' => $user->coverage_type ?? 'individual',
            'budget_range' => $user->budget_range
        ];
    }
}
