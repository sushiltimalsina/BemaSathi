<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\BuyRequest;
use App\Models\Policy;
use App\Services\LeadDistributor;
use App\Services\NotificationService;
use App\Services\PremiumCalculator;
use Illuminate\Support\Carbon;
use App\Mail\BuyRequestSubmittedMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

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

        $basePremium = $quote['calculated_total'];
        $interval = $data['billing_cycle'] ?? 'yearly';
        [$cycleAmount, $nextRenewal] = $this->calculateBillingInterval($interval, $basePremium);

        $data['user_id'] = $user->id;
        $data['status']  = 'pending';
        $data['calculated_premium'] = $basePremium;
        $data['cycle_amount']      = $cycleAmount;
        $data['billing_cycle']     = $interval;
        $data['next_renewal_date'] = $nextRenewal;
        $data['renewal_status']    = 'active';

        $buyRequest = BuyRequest::create($data);

        // Assign agent
        $assignedAgent = $this->leadDistributor->assign($buyRequest);

        $msg = $assignedAgent
            ? 'Request submitted and assigned to an agent.'
            : 'Request submitted successfully.';

        $recipient = $buyRequest->email ?: $user->email;
        if ($recipient) {
            try {
                $buyRequest->loadMissing('policy');
                Mail::to($recipient)->send(new BuyRequestSubmittedMail($buyRequest));
            } catch (\Throwable $e) {
                Log::warning('Failed sending buy request email', [
                    'user_id' => $user->id,
                    'buy_request_id' => $buyRequest->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->notifier->notify($user, 'Buy Request Submitted', $msg, [
            'buy_request_id' => $buyRequest->id
        ], 'system', false);

        return response()->json([
            'success' => true,
            'message' => $msg,
            'buy_request_id' => $buyRequest->id,
            'premium' => $buyRequest->cycle_amount,
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

        $requests = BuyRequest::with('policy')
            ->where('user_id', $user?->id)
            ->whereHas('payments', function ($query) {
                $query->where('is_verified', true)
                    ->whereIn('status', ['success', 'paid', 'completed']);
            })
            ->orderByDesc('created_at')
            ->get();

        return response()->json($requests);
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
    public function preview(Request $request)
{
    $user = auth()->user();

    $data = $request->validate([
        'policy_id' => 'required|exists:policies,id',
        'billing_cycle' => 'required|in:monthly,quarterly,half_yearly,yearly'
    ]);

    $policy = Policy::findOrFail($data['policy_id']);
    $profile = $this->resolveProfile($user);

    $quote = $this->calculator->quote(
        $policy,
        $profile['age'],
        $profile['is_smoker'],
        $profile['health_score'],
        $profile['coverage_type'],
        $profile['budget_range']
    );

    $basePremium = $quote['calculated_total'];

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
