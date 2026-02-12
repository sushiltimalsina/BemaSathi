<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Policy;

use App\Services\PremiumCalculator;

class ComparisonController extends Controller
{
    public function __construct(private PremiumCalculator $calculator) {}

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

        $user = $request->user();
        
        // --- STEP 1: Personalization Layer ---
        foreach ($policies as $policy) {
            if ($user) {
                // Fetch user data for personalized comparison
                $policy->effective_premium = $this->calculator->quote(
                    $policy,
                    $user->dob ? \Illuminate\Support\Carbon::parse($user->dob)->age : 30,
                    (bool)$user->is_smoker,
                    $user->health_score ?? 70,
                    $user->coverage_type ?? 'individual',
                    $user->budget_range,
                    $user->family_members ?? 1
                )['calculated_total'];
            } else {
                $policy->effective_premium = $policy->premium_amt;
            }
        }

        // --- STEP 2: Differential Gap Analysis ---
        $results = $policies->map(function ($policy) use ($policies) {
            $others = $policies->where('id', '!=', $policy->id);
            $analysis = [
                'strengths' => [],
                'weaknesses' => []
            ];

            foreach ($others as $other) {
                // Price Gap
                if ($policy->effective_premium < $other->effective_premium * 0.9) {
                    $analysis['strengths'][] = "रु. " . ($other->effective_premium - $policy->effective_premium) . " cheaper than " . $other->policy_name;
                }

                // Medical Gap
                $pCond = is_array($policy->covered_conditions) ? $policy->covered_conditions : [];
                $oCond = is_array($other->covered_conditions) ? $other->covered_conditions : [];
                $missing = array_diff($oCond, $pCond);
                $extra = array_diff($pCond, $oCond);

                if (count($extra) > 0) {
                    $analysis['strengths'][] = "Covers " . count($extra) . " more conditions than " . $other->policy_name;
                }
                if (count($missing) > 0) {
                    $analysis['weaknesses'][] = "Missing " . count($missing) . " conditions found in " . $other->policy_name;
                }
            }

            $policy->gap_analysis = $analysis;
            return $policy;
        });

        // --- STEP 3: Categorical Winner Determination ---
        $valueWinner = $results->sortBy(fn($p) => $p->effective_premium / max($p->coverage_limit, 1))->first();
        $medicalWinner = $results->sortByDesc(fn($p) => count(is_array($p->covered_conditions) ? $p->covered_conditions : []))->first();
        $overallWinner = $results->sortByDesc(function($p) {
            // Composite Score
            return ($p->company_rating * 0.4) + ($p->coverage_limit / $p->effective_premium * 0.6);
        })->first();

        return response()->json([
            'policies' => $results,
            'winners' => [
                'value' => $valueWinner->id,
                'medical' => $medicalWinner->id,
                'overall' => $overallWinner->id
            ]
        ]);
    }
}
