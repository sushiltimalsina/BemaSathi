<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuyRequest;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AdminRenewalController extends Controller
{
    private NotificationService $notifier;

    public function __construct(NotificationService $notifier)
    {
        $this->notifier = $notifier;
    }

    public function index()
    {
        $renewals = BuyRequest::with(['user', 'policy'])
            ->whereHas('payments', function ($query) {
                $query->where('is_verified', true)
                    ->whereIn('status', ['success', 'paid', 'completed']);
            })
            ->select([
                'id',
                'user_id',
                'policy_id',
                'billing_cycle',
                'cycle_amount',
                'next_renewal_date',
                'renewal_status',
            ])
            ->orderByDesc('next_renewal_date')
            ->get();

        return response()->json($renewals);
    }

    public function notify(Request $request, BuyRequest $buyRequest)
    {
        $buyRequest->load(['user', 'policy']);

        if (!$buyRequest->user || !$buyRequest->next_renewal_date) {
            return response()->json([
                'message' => 'Unable to send renewal notification.',
            ], 422);
        }

        $daysLeft = Carbon::now()->diffInDays(
            Carbon::parse($buyRequest->next_renewal_date),
            false
        );

        if ($daysLeft > 5) {
            return response()->json([
                'message' => 'Renewal date is not within 5 days.',
            ], 422);
        }

        $policyName = optional($buyRequest->policy)->policy_name ?? 'your policy';
        $dateText = Carbon::parse($buyRequest->next_renewal_date)->toFormattedDateString();

        $this->notifier->notify(
            $buyRequest->user,
            'Renewal reminder',
            "Your renewal for {$policyName} is due on {$dateText}. Please renew to keep your coverage active.",
            [
                'buy_request_id' => $buyRequest->id,
                'policy_id' => $buyRequest->policy_id,
            ],
            'system'
        );

        return response()->json([
            'message' => 'Renewal notification sent.',
        ]);
    }
}
