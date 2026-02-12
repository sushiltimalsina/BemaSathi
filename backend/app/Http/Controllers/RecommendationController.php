<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Policy;
use App\Models\User;
use App\Models\Payment;
use App\Services\PremiumCalculator;
use Illuminate\Support\Carbon;

class RecommendationController extends Controller
{
    public function __construct(private PremiumCalculator $calculator) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $type = $request->query('insurance_type');

        $ownedPolicyIds = collect();
        if ($user) {
            $ownedPolicyIds = Payment::query()
                ->where('user_id', $user->id)
                ->where('is_verified', true)
                ->whereIn('status', ['success', 'paid', 'completed'])
                ->pluck('policy_id')
                ->filter()
                ->unique();
        }

        $policies = Policy::when($type, fn($q) => $q->where('insurance_type', $type))
            ->when($ownedPolicyIds->isNotEmpty(), function ($q) use ($ownedPolicyIds) {
                $q->whereNotIn('id', $ownedPolicyIds);
            })
            ->get();

        $profile = $this->resolveProfile($user);

        // Collaborative Filtering: Peer Popularity with Global Fallback
        $popularityMap = $this->getPeerPopularity($profile, $user);
        $isExistingCustomer = $ownedPolicyIds->isNotEmpty();

        $scored = $policies->map(function ($policy) use ($profile, $user, $popularityMap, $isExistingCustomer) {

            // Always compute personalized premium with full context
            if ($user) {
                $policy->personalized_premium = $this->calculator->quote(
                    $policy,
                    $profile['age'],
                    $profile['is_smoker'],
                    $profile['health_score'],
                    $profile['coverage_type'],
                    $profile['budget_range'],
                    $profile['family_members'],
                    [
                        'city' => $profile['city'], 
                        'is_existing_customer' => $isExistingCustomer,
                        'conditions' => $profile['conditions'],
                        'family_ages' => $profile['family_ages'] // Pass detailed ages
                    ]
                )['calculated_total'];
            } else {
                $policy->personalized_premium = $policy->premium_amt;
            }

            // Compute match score and reasons (now includes Social Proof + Underwriting + Demographic Feature Fit)
            $scoreData = $this->computeScore($policy, $profile, $popularityMap);
            $policy->match_score = $scoreData['percent'];
            $policy->match_reasons = $scoreData['reasons'];
            $policy->approval_likelihood = $scoreData['approval_likelihood'];

            return $policy;
        });

        // Sort by best-fit score
        $sorted = $scored->sortByDesc('match_score')->values();

        if ($sorted->count() <= 2) {
            return response()->json(['recommended' => $sorted]);
        }

        // Balanced Selection Strategy:
        // 1. The "Absolute Best Fit"
        $bestFit = $sorted->first();

        // 2. The "Value Champion" (Highest coverage limit per unit of premium among top 5)
        $valueChampion = $sorted->slice(1, 4)->map(function ($p) {
            $p->value_index = $p->coverage_limit / max($p->personalized_premium, 1);
            return $p;
        })->sortByDesc('value_index')->first();

        $recommended = collect([$bestFit, $valueChampion])->unique('id')->values();

        return response()->json([
            'recommended' => $recommended
        ]);
    }


    // ============================
    // SCORING ENGINE
    // ============================
    private function computeScore(Policy $policy, array $profile, array $popularityMap = [])
    {
        $age = $profile['age'];
        $healthScore = $profile['health_score'] ?? 70;
        $hasFamily = ($profile['family_members'] ?? 1) > 1;
        
        // --- STEP 1: Dynamic Weight Definition ---
        if ($age < 30) {
            $wBudget = 35; $wMedical = 15; $wFinePrint = 10; $wSocial = 25; $wTrust = 15;
        } elseif ($age < 50) {
            $wBudget = 20; $wMedical = 30; $wFinePrint = 20; $wSocial = 15; $wTrust = 15;
        } else {
            $wBudget = 10; $wMedical = 40; $wFinePrint = 25; $wSocial = 10; $wTrust = 15;
        }

        $weightedScore = 0;
        $reasons = [];
        $premium = $policy->personalized_premium ?? $policy->premium_amt;

        // --- STEP 2: Predictive Underwriting (Approval Probability) ---
        $approvalLikelihood = 'High';
        $underwritingPenalty = 0;
        
        $userCond = $profile['conditions'] ?? [];
        $policyExclusions = is_array($policy->exclusions) ? $policy->exclusions : [];

        // Condition 1: Exclusions Match (Hard Stop)
        $excludedMatches = array_intersect($userCond, $policyExclusions);
        if (!empty($excludedMatches)) {
            $approvalLikelihood = 'Very Low';
            $underwritingPenalty = 40; // Severe de-ranking
            $reasons[] = "High risk of rejection due to policy exclusions";
        } 
        // Condition 2: High Risk Profile vs Low Waiting Period
        elseif ($healthScore < 45 && ($policy->waiting_period_days ?? 0) < 90) {
            $approvalLikelihood = 'Low';
            $underwritingPenalty = 20;
            $reasons[] = "Strict medical underwriting expected";
        }
        // Condition 3: Perfect Profile
        elseif ($healthScore > 85 && empty($userCond)) {
            $approvalLikelihood = 'Guaranteed';
            $reasons[] = "Instantly eligible for this plan";
        }

        // --- STEP 3: Scoring Components ---

        // 1. Medical Compatibility
        $policyCond = is_array($policy->covered_conditions) ? $policy->covered_conditions : [];
        $isGenericCritical = in_array('Critical Illness', $policyCond);
        $criticalConditions = ['Heart Disease', 'Cancer', 'Kidney Failure', 'Stroke'];
        
        if (!empty($userCond)) {
            $matches = array_intersect($userCond, $policyCond);
            $hasSemanticMatch = $isGenericCritical && !empty(array_intersect($userCond, $criticalConditions));
            $matchRatio = count($userCond) > 0 ? (count($matches) + ($hasSemanticMatch ? 1 : 0)) / count($userCond) : 1;
            $weightedScore += (min($matchRatio, 1) * $wMedical);
            if ($matchRatio >= 1) $reasons[] = "Comprehensive medical match";
        } else {
            $weightedScore += $wMedical;
        }

        // 2. Contract Quality
        $waitingDays = (int)($policy->waiting_period_days ?? 0);
        $copayPercent = (int)($policy->copay_percent ?? 0);
        $waitFactor = max(0, 1 - ($waitingDays / 365));
        $copayFactor = max(0, 1 - ($copayPercent / 20));
        $weightedScore += (($waitFactor * 0.7 + $copayFactor * 0.3) * $wFinePrint);
        if ($waitingDays <= 30) $reasons[] = "No-wait immediate coverage";

        // 3. Budget Fit - "The Sweet Spot Strategy"
        if ($profile['budget_range']) {
            $budget = $this->parseBudgetRange($profile['budget_range']);
            $max = $budget['max'];
            
            if ($premium <= $max && $premium >= $max * 0.6) {
                $weightedScore += $wBudget;
                $reasons[] = "Maximizes your coverage capacity";
            } elseif ($premium < $max * 0.6) {
                $weightedScore += ($wBudget * 0.7);
                $reasons[] = "Cost-effective choice";
            } elseif ($premium <= $max * 1.15) {
                $weightedScore += ($wBudget * 0.4);
                $reasons[] = "Premium quality (slightly above budget)";
            }
        } else {
            $weightedScore += $wBudget;
        }

        // 4. Social Proof: Waterfall Fallback
        $popularity = $popularityMap[$policy->id] ?? 0;
        if ($popularity >= 3) {
            $weightedScore += $wSocial;
            $reasons[] = "Top choice for users in your age group";
        } elseif ($popularity >= 1 || ($popularityMap['is_global_top'] ?? false)) {
            $weightedScore += ($wSocial * 0.5);
            $reasons[] = "Community favorite";
        }

        // 5. Provider Trust
        $trustFactor = min($policy->company_rating / 5, 1);
        $weightedScore += ($trustFactor * $wTrust);

        // Apply Underwriting Penalty
        $finalScore = max(0, $weightedScore - $underwritingPenalty);

        // Contextual Bonuses
        $policyName = strtolower($policy->policy_name);
        if ($hasFamily && str_contains($policyName, 'family')) {
            $finalScore += 5;
            $reasons[] = "Optimized for family protection";
        }

        // Demographic Specificity (The "Perfection" Upgrade)
        // If profile indicates young children (e.g., user is 25-35 with family), look for Maternity/Child benefits
        if ($age >= 24 && $age <= 40 && $hasFamily) {
             if (str_contains($policyName, 'maternity') || str_contains($policyName, 'child')) {
                 $finalScore += 10;
                 $reasons[] = "Includes Maternity/Child benefits";
             }
        }
        // If profile suggests aging parents (via family structure inference or explicit ages)
        if (($profile['has_seniors'] ?? false) || $age > 50) {
             if (str_contains($policyName, 'senior') || str_contains($policyName, 'critical')) {
                 $finalScore += 10;
                 $reasons[] = "High protection for seniors";
             }
        }

        return [
            'percent' => min(100, round($finalScore)),
            'reasons' => array_unique($reasons),
            'approval_likelihood' => $approvalLikelihood
        ];
    }


    /**
     * Finds policies commonly purchased by users in a similar "Peer Group".
     */
    private function getPeerPopularity(array $profile, ?User $currentUser): array
    {
        $ageMin = max(1, $profile['age'] - 5);
        $ageMax = $profile['age'] + 5;

        // Find peer user IDs based on Age-bracket and Smoker-status
        $peerIds = User::query()
            ->when($currentUser, fn($q) => $q->where('id', '!=', $currentUser->id))
            ->whereBetween('dob', [
                now()->subYears($ageMax)->toDateString(),
                now()->subYears($ageMin)->toDateString()
            ])
            ->where('is_smoker', $profile['is_smoker'])
            ->pluck('id');

        if ($peerIds->isEmpty()) {
            return [];
        }

        // Count successful policy purchases in this peer group
        return Payment::query()
            ->whereIn('user_id', $peerIds)
            ->where('is_verified', true)
            ->whereIn('status', ['success', 'paid', 'completed'])
            ->groupBy('policy_id')
            ->selectRaw('policy_id, count(*) as count')
            ->pluck('count', 'policy_id')
            ->toArray();
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

        $dob = $user->dob ?? $kyc?->dob;
        $age = ($dob ? Carbon::parse($dob)->age : 30);

        // Resolve City from Address
        $address = strtolower($user->address ?? '');
        $city = 'default';
        if (str_contains($address, 'kathmandu')) $city = 'Kathmandu';
        elseif (str_contains($address, 'pokhara')) $city = 'Pokhara';
        elseif (str_contains($address, 'lalitpur')) $city = 'Lalitpur';

        // Extract detailed family demographics
        $familyDetails = $user->family_member_details ?? [];
        $familyAges = [];
        $hasSeniors = false;
        
        if (is_array($familyDetails)) {
            foreach ($familyDetails as $member) {
                // Ensure age is calculated safely
                if (isset($member['dob'])) {
                    $mAge = Carbon::parse($member['dob'])->age;
                    $familyAges[] = $mAge;
                    if ($mAge > 55) $hasSeniors = true;
                }
            }
        }
        $familyAges[] = $age; // Include self

        return [
            'age' => max(1, min(120, $age)),
            'city' => $city,
            'is_smoker' => (bool)$user->is_smoker,
            'health_score' => $user->health_score ?? 70,
            'coverage_type' => $user->coverage_type ?? 'individual',
            'budget_range' => $user->budget_range,
            'family_members' => $user->family_members ?? 1,
            'family_ages' => $familyAges,
            'has_seniors' => $hasSeniors,
            'weight' => $user->weight_kg,
            'height' => $user->height_cm,
            'occupation_class' => $user->occupation_class ?? 'class_1',
            'conditions' => is_array($user->pre_existing_conditions)
                ? $user->pre_existing_conditions
                : json_decode($user->pre_existing_conditions ?? '[]', true)
        ];
    }
}
