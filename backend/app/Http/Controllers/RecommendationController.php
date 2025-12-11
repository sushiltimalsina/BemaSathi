<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Policy;
use App\Models\User;
use App\Services\PremiumCalculator;
use Illuminate\Support\Carbon;

class RecommendationController extends Controller
{
    public function __construct(private PremiumCalculator $calculator) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $type = $request->query('insurance_type');

        $policies = Policy::when($type, fn($q) => $q->where('insurance_type', $type))->get();

        $profile = $this->resolveProfile($user);

        $scored = $policies->map(function ($policy) use ($profile, $user) {

            // Always compute personalized premium for logged user
            if ($user) {
                $policy->personalized_premium = $this->calculator->quote(
                    $policy,
                    $profile['age'],
                    $profile['is_smoker'],
                    $profile['health_score'],
                    $profile['coverage_type'],
                    $profile['budget_range']
                )['calculated_total'];
            } else {
                $policy->personalized_premium = $policy->premium_amt;
            }

            // Compute match score
            $scoreData = $this->computeScore($policy, $profile);
            $policy->match_score = $scoreData['percent'];

            return $policy;
        });

        // Sort by best-fit score
        $sorted = $scored->sortByDesc('match_score')->values();

        return response()->json([
            'recommended' => $sorted->take(2)
        ]);
    }


    // ============================
    // SCORING ENGINE
    // ============================
    private function computeScore(Policy $policy, array $profile)
    {
        $criteria = [];

        $premium = $policy->personalized_premium ?? $policy->premium_amt;

        // Budget Fit
        if ($profile['budget_range']) {
            $budget = $this->parseBudgetRange($profile['budget_range']);
            $criteria[] = (!is_finite($budget['max']) || $premium <= $budget['max']);
        }

        // Smoker Logic
        $criteria[] = !$profile['is_smoker'] || $policy->supports_smokers;

        // Pre-existing conditions logic
        $userCond = $profile['conditions'];
        $policyCond = is_array($policy->covered_conditions)
            ? $policy->covered_conditions
            : json_decode($policy->covered_conditions ?? '[]', true);

        if (!empty($userCond)) {
            $matches = array_intersect($userCond, $policyCond ?? []);
            $criteria[] = count($matches) > 0;
        }

        // Rating logic
        $criteria[] = $policy->company_rating >= 3.5;

        // Final weighting
        $total = count($criteria);
        $ok = count(array_filter($criteria));

        return [
            'ok' => $ok,
            'total' => $total,
            'percent' => round(($ok / $total) * 100)
        ];
    }


    private function parseBudgetRange(?string $range)
    {
        return match ($range) {
            '<10000' => ['min' => 0, 'max' => 10000],
            '10000-20000' => ['min' => 10000, 'max' => 20000],
            '20000-30000' => ['min' => 20000, 'max' => 30000],
            '>30000' => ['min' => 30000, 'max' => INF],
            default => ['min' => 0, 'max' => INF],
        };
    }


    private function resolveProfile(User $user)
    {
        $kyc = $user->kycDocuments()->where('status', 'approved')->latest()->first();

        $dob = $kyc?->dob ?? $user->dob;
        $age = ($dob ? Carbon::parse($dob)->age : 30);

        return [
            'age' => max(1, min(120, $age)),
            'is_smoker' => (bool)$user->is_smoker,
            'health_score' => $user->health_score ?? 70,
            'coverage_type' => $user->coverage_type ?? 'individual',
            'budget_range' => $user->budget_range,
            'conditions' => is_array($user->pre_existing_conditions)
                ? $user->pre_existing_conditions
                : json_decode($user->pre_existing_conditions ?? '[]', true)
        ];
    }
}
