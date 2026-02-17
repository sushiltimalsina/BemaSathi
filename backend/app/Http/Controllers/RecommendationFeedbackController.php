<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RecommendationFeedback;

class RecommendationFeedbackController extends Controller
{
    /**
     * Track when user clicks on a recommended policy
     */
    public function trackClick(Request $request)
    {
        $validated = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'position' => 'required|integer|min:1'
        ]);

        RecommendationFeedback::where('user_id', $request->user()->id)
            ->where('policy_id', $validated['policy_id'])
            ->where('shown_at', '>', now()->subHours(24))
            ->update(['clicked' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Track time spent viewing a policy
     */
    public function trackTimeSpent(Request $request)
    {
        $validated = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'seconds' => 'required|integer|min:0'
        ]);

        RecommendationFeedback::where('user_id', $request->user()->id)
            ->where('policy_id', $validated['policy_id'])
            ->where('shown_at', '>', now()->subHours(24))
            ->update(['time_spent_seconds' => $validated['seconds']]);

        return response()->json(['success' => true]);
    }

    /**
     * Track when user purchases a policy
     * Call this from your Payment controller after successful purchase
     */
    public static function trackPurchase(int $userId, int $policyId): void
    {
        RecommendationFeedback::where('user_id', $userId)
            ->where('policy_id', $policyId)
            ->where('shown_at', '>', now()->subDays(7))
            ->update(['purchased' => true]);
    }
}
