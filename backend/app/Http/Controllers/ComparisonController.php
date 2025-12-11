<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Policy;

class ComparisonController extends Controller
{
    public function compare(Request $request)
    {
        $data = $request->validate([
            'policy_ids' => 'required|array|min:2|max:3',
            'priority' => 'nullable|string'
        ]);

        // Fetch policies
        $policies = Policy::whereIn('id', $data['policy_ids'])->get();

        if ($policies->count() < 2) {
            return response()->json(['message' => 'Invalid policy IDs'], 400);
        }

        // Weighted scoring factors
        $weights = [
            'premium_amt' => ($data['priority'] === 'low_cost') ? 0.5 : 0.3,
            'coverage_limit' => ($data['priority'] === 'high_coverage') ? 0.5 : 0.4,
            'company_rating' => 0.3
        ];

        // Normalize + Score
        foreach ($policies as $policy) {
            $premiumScore = 1 / max($policy->premium_amt, 1);
            $coverageScore = $policy->coverage_limit;
            $ratingScore = $policy->company_rating;

            $policy->comparison_score =
                ($premiumScore * $weights['premium_amt']) +
                ($coverageScore * $weights['coverage_limit']) +
                ($ratingScore * $weights['company_rating']);
        }

        // Sort by best score
        $sorted = $policies->sortByDesc('comparison_score')->values();

        return response()->json([
            'policies' => $sorted,
            'best' => $sorted->first()
        ]);
    }
}
