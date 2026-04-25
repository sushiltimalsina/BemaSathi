<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Rating;
use App\Models\Policy;
use Illuminate\Support\Facades\DB;

class RatingController extends Controller
{
    /**
     * Store or update a user rating for a policy.
     */
    public function store(Request $request)
    {
        $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'rating'    => 'required|integer|min:1|max:5',
            'review'    => 'nullable|string|max:1000'
        ]);

        $user = auth()->user();
        $policyId = $request->policy_id;

        // VERIFICATION: Check if the user has actually purchased this policy
        $hasPurchased = \App\Models\BuyRequest::where('user_id', $user->id)
            ->where('policy_id', $policyId)
            ->exists();

        if (!$hasPurchased) {
            return response()->json([
                'message' => 'Only verified buyers can rate this policy. Please purchase the policy first.'
            ], 403);
        }

        // Use updateOrCreate to ensure one rating per user per policy
        $rating = Rating::updateOrCreate(
            ['user_id' => $user->id, 'policy_id' => $policyId],
            ['rating' => $request->rating, 'review' => $request->review]
        );

        // 1. Get the policy to access its admin_rating
        $policy = Policy::findOrFail($policyId);
        $adminRating = $policy->admin_rating ?: 0;

        // 2. Get user ratings stats
        $userRatings = Rating::where('policy_id', $policyId)->get();
        $userCount = $userRatings->count();
        $userSum = $userRatings->sum('rating');

        // 3. Calculate weighted average: (AdminRating + UserSum) / (1 + UserCount)
        // This ensures the Admin's professional rating always acts as a base.
        $totalSum = $adminRating + $userSum;
        $totalCount = 1 + $userCount;
        $finalAverage = $totalSum / $totalCount;
        
        // 4. Update the policy's displayed company_rating column
        $policy->update(['company_rating' => round($finalAverage, 1)]);

        return response()->json([
            'message' => 'Rating submitted successfully!',
            'rating'  => $rating,
            'average_rating' => round($finalAverage, 1)
        ]);
    }
}
