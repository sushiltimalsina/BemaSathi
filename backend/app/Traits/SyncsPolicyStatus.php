<?php

namespace App\Traits;

use App\Models\BuyRequest;
use Carbon\Carbon;

trait SyncsPolicyStatus
{
    /**
     * Silent sync policy statuses to ensure 'active' -> 'due' -> 'expired' transitions are current.
     */
    protected function syncPolicyStatuses(?int $userId = null)
    {
        $timezone = config('app.timezone', 'Asia/Kathmandu');
        $today = Carbon::now($timezone);
        $graceDays = (int) env('RENEWAL_GRACE_DAYS', 7);

        // Mark Active -> Due if date passed
        $activeToDue = BuyRequest::where('renewal_status', 'active')
            ->whereDate('next_renewal_date', '<=', $today->toDateString());
        
        if ($userId) {
            $activeToDue->where('user_id', $userId);
        }
        $activeToDue->update(['renewal_status' => 'due']);

        // Mark Due -> Expired if grace period passed
        $dueToExpired = BuyRequest::where('renewal_status', 'due')
            ->whereDate('next_renewal_date', '<', $today->copy()->subDays($graceDays)->toDateString());
        
        if ($userId) {
            $dueToExpired->where('user_id', $userId);
        }
        $dueToExpired->update(['renewal_status' => 'expired']);
    }
}
