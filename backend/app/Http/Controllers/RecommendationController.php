<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Policy;
use App\Models\User;
use App\Models\Payment;
use App\Models\RecommendationFeedback;
use App\Services\PremiumCalculator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Collection;

class RecommendationController extends Controller
{
    use \App\Traits\HandlesInsuranceQuotes;

    public function __construct(private PremiumCalculator $calculator) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $type = $request->query('insurance_type');

        // Get A/B test variant for this user
        $variant = $this->getABTestVariant($user);

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

        $profile = $user ? $this->resolveStandardProfile($user) : [
            'age' => 30,
            'city' => 'default',
            'region_type' => 'urban',
            'is_smoker' => false,
            'health_score' => 70,
            'coverage_type' => 'individual',
            'budget_range' => null,
            'family_members' => 1,
            'family_ages' => [30],
            'has_seniors' => false,
            'weight' => null,
            'height' => null,
            'occupation_class' => 'class_1',
            'conditions' => []
        ];

        // Get popularity with multi-dimensional similarity
        $popularityMap = $this->getPeerPopularity($profile, $user);

        $scored = $policies->map(function ($policy) use ($profile, $user, $popularityMap, $variant) {

            // Always compute personalized premium with full context
            if ($user) {
                $policy->personalized_premium = $this->getPersonalizedPremium(
                    $this->calculator,
                    $policy,
                    $profile
                );
            } else {
                $policy->personalized_premium = $policy->premium_amt;
            }

            // Compute match score based on A/B variant
            $scoreData = match($variant) {
                'feedback_enhanced' => $this->computeScoreWithFeedback($policy, $profile, $popularityMap, $user),
                'weighted_medical' => $this->computeScoreWithWeightedMedical($policy, $profile, $popularityMap, $user),
                default => $this->computeScore($policy, $profile, $popularityMap)
            };

            $policy->match_score = $scoreData['percent'];
            $policy->match_reasons = $scoreData['reasons'];
            $policy->approval_likelihood = $scoreData['approval_likelihood'];
            $policy->ab_variant = $variant; // Track which algorithm was used

            return $policy;
        });

        // Sort by best-fit score
        $sorted = $scored->sortByDesc('match_score')->values();

        if ($sorted->count() <= 2) {
            // Track recommendations
            if ($user) {
                $this->trackRecommendations($user, $sorted, $variant);
            }
            
            return response()->json(['recommended' => $sorted, 'variant' => $variant]);
        }

        // Diverse selection strategy
        $recommended = $this->diverseSelection($sorted, 5);

        // Track recommendations for feedback loop
        if ($user) {
            $this->trackRecommendations($user, $recommended, $variant);
        }

        return response()->json([
            'recommended' => $recommended,
            'variant' => $variant,
            'ab_test_active' => true
        ]);
    }


    // ============================
    // A/B TESTING FRAMEWORK
    // ============================
    
    /**
     * Assign users to A/B test variants consistently
     */
    private function getABTestVariant(?User $user): string
    {
        if (!$user) {
            return 'control';
        }

        // Consistent hashing: same user always gets same variant
        $hash = crc32($user->id . 'recommendation_experiment_v1');
        $bucket = $hash % 100;

        return match(true) {
            $bucket < 33 => 'control',              // 33% - Original algorithm
            $bucket < 66 => 'feedback_enhanced',    // 33% - With real-time feedback
            default => 'weighted_medical'           // 34% - Weighted medical matching
        };
    }


    // ============================
    // REAL-TIME FEEDBACK LOOP
    // ============================
    
    /**
     * Track shown recommendations for feedback analysis
     */
    private function trackRecommendations(User $user, $recommendations, string $variant): void
    {
        foreach ($recommendations as $index => $policy) {
            RecommendationFeedback::create([
                'user_id' => $user->id,
                'policy_id' => $policy->id,
                'position' => $index + 1,
                'match_score' => $policy->match_score,
                'variant' => $variant,
                'clicked' => false,
                'purchased' => false,
                'shown_at' => now()
            ]);
        }
    }

    /**
     * Enhanced scoring with real-time feedback signals
     */
    private function computeScoreWithFeedback(Policy $policy, array $profile, array $popularityMap, ?User $user)
    {
        // Get base score
        $baseScore = $this->computeScore($policy, $profile, $popularityMap);
        
        if (!$user) {
            return $baseScore;
        }

        // Calculate feedback signals from historical data
        $feedbackBoost = $this->calculateFeedbackBoost($policy, $profile);
        
        // Adjust final score
        $baseScore['percent'] = min(100, $baseScore['percent'] + $feedbackBoost['score_adjustment']);
        
        // Add feedback-based reasons
        if (!empty($feedbackBoost['reasons'])) {
            $baseScore['reasons'] = array_merge($baseScore['reasons'], $feedbackBoost['reasons']);
        }

        return $baseScore;
    }

    /**
     * Calculate score adjustment based on user feedback data
     */
    private function calculateFeedbackBoost(Policy $policy, array $profile): array
    {
        $cacheKey = "feedback_boost_{$policy->id}_{$profile['age']}_{$profile['is_smoker']}";
        
        return Cache::remember($cacheKey, 3600, function() use ($policy, $profile) {
            $ageMin = max(1, $profile['age'] - 5);
            $ageMax = $profile['age'] + 5;

            // Get feedback from similar users
            $feedback = DB::table('recommendation_feedback as rf')
                ->join('users as u', 'rf.user_id', '=', 'u.id')
                ->where('rf.policy_id', $policy->id)
                ->where('rf.shown_at', '>', now()->subMonths(3)) // Recent data only
                ->whereBetween('u.dob', [
                    now()->subYears($ageMax)->toDateString(),
                    now()->subYears($ageMin)->toDateString()
                ])
                ->where('u.is_smoker', $profile['is_smoker'])
                ->selectRaw('
                    COUNT(*) as total_shown,
                    SUM(CASE WHEN clicked = 1 THEN 1 ELSE 0 END) as total_clicks,
                    SUM(CASE WHEN purchased = 1 THEN 1 ELSE 0 END) as total_purchases,
                    AVG(CASE WHEN time_spent_seconds IS NOT NULL THEN time_spent_seconds ELSE 0 END) as avg_time_spent
                ')
                ->first();

            if (!$feedback || $feedback->total_shown < 5) {
                return ['score_adjustment' => 0, 'reasons' => []];
            }

            $ctr = $feedback->total_clicks / $feedback->total_shown;
            $conversionRate = $feedback->total_clicks > 0 
                ? ($feedback->total_purchases / $feedback->total_clicks) 
                : 0;
            $engagementScore = min($feedback->avg_time_spent / 60, 1); // Normalize to 0-1

            // Calculate boost (max +15 points)
            $scoreAdjustment = (
                $ctr * 5 +                    // Click-through rate worth 5 points
                $conversionRate * 8 +         // Conversion worth 8 points
                $engagementScore * 2          // Engagement worth 2 points
            );

            $reasons = [];
            
            if ($conversionRate > 0.15) {
                $conversionPercent = round($conversionRate * 100);
                $reasons[] = "{$conversionPercent}% of similar users purchased this";
            }
            
            if ($ctr > 0.25) {
                $reasons[] = "Highly engaging for users like you";
            }

            return [
                'score_adjustment' => round($scoreAdjustment, 2),
                'reasons' => $reasons
            ];
        });
    }


    // ============================
    // WEIGHTED MEDICAL MATCHING
    // ============================
    
    /**
     * Enhanced scoring with weighted medical condition matching
     */
    private function computeScoreWithWeightedMedical(Policy $policy, array $profile, array $popularityMap, ?User $user)
    {
        $age = $profile['age'];
        $healthScore = $profile['health_score'] ?? 70;
        $hasFamily = ($profile['family_members'] ?? 1) > 1;
        
        // Dynamic Weight Definition
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

        // Predictive Underwriting
        $approvalLikelihood = 'High';
        $underwritingPenalty = 0;
        
        $userCond = $profile['conditions'] ?? [];
        $policyExclusions = is_array($policy->exclusions) ? $policy->exclusions : [];

        // Exclusions Match (Hard Stop)
        $excludedMatches = array_intersect($userCond, $policyExclusions);
        if (!empty($excludedMatches)) {
            $approvalLikelihood = 'Very Low';
            $underwritingPenalty = 40;
            $reasons[] = "High risk of rejection due to policy exclusions";
        } 
        elseif ($healthScore < 45 && ($policy->waiting_period_days ?? 0) < 90) {
            $approvalLikelihood = 'Low';
            $underwritingPenalty = 20;
            $reasons[] = "Strict medical underwriting expected";
        }
        elseif ($healthScore > 85 && empty($userCond)) {
            $approvalLikelihood = 'Guaranteed';
            $reasons[] = "Instantly eligible for this plan";
        }

        // *** ENHANCED: WEIGHTED MEDICAL COMPATIBILITY ***
        $policyCond = is_array($policy->covered_conditions) ? $policy->covered_conditions : [];
        
        if (!empty($userCond)) {
            $medicalScore = $this->weightedMedicalCompatibility($userCond, $policyCond, $policy);
            $weightedScore += ($medicalScore * $wMedical);
            
            if ($medicalScore > 0.9) {
                $reasons[] = "Comprehensive medical match";
            } elseif ($medicalScore > 0.6) {
                $reasons[] = "Good coverage for your conditions";
            }
        } else {
            $weightedScore += $wMedical;
        }

        // Contract Quality
        $waitingDays = (int)($policy->waiting_period_days ?? 0);
        $copayPercent = (int)($policy->copay_percent ?? 0);
        $waitFactor = max(0, 1 - ($waitingDays / 365));
        $copayFactor = max(0, 1 - ($copayPercent / 20));
        $weightedScore += (($waitFactor * 0.7 + $copayFactor * 0.3) * $wFinePrint);
        if ($waitingDays <= 30) $reasons[] = "No-wait immediate coverage";

        // Budget Fit - "The Sweet Spot Strategy"
        if ($profile['budget_range']) {
            $budget = $this->parseBudgetRange($profile['budget_range']);
            $max = $budget['max'];
            $isHighTier = in_array($profile['budget_range'], ['50k+', '50K+', '>30000', 'default']);
            
            if ($premium <= $max && $premium >= $max * 0.6) {
                $weightedScore += $wBudget;
                $reasons[] = "Maximizes your coverage capacity";
            } elseif ($premium < $max * 0.6) {
                $weightedScore += ($wBudget * 0.7);
                if (!$isHighTier) {
                    $savings = round($max - $premium);
                    $reasons[] = "Saves you ₹{$savings}/year";
                } else {
                    $reasons[] = "Well within your budget";
                }
            } elseif ($premium <= $max * 1.15) {
                $weightedScore += ($wBudget * 0.4);
                $reasons[] = "Premium quality (slightly above budget)";
            }
        } else {
            $weightedScore += $wBudget;
        }

        // Social Proof: Waterfall Fallback
        $popularity = $popularityMap[$policy->id] ?? 0;
        if ($popularity >= 3) {
            $weightedScore += $wSocial;
            $reasons[] = "{$popularity} similar users chose this";
        } elseif ($popularity >= 1) {
            $weightedScore += ($wSocial * 0.5);
            $reasons[] = "Community favorite";
        } elseif ($popularityMap['is_global_top'] ?? false) {
            $weightedScore += ($wSocial * 0.3);
            $reasons[] = "Popular nationwide";
        }

        // Provider Trust
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

        // Demographic Specificity
        if ($age >= 24 && $age <= 40 && $hasFamily) {
             if (str_contains($policyName, 'maternity') || str_contains($policyName, 'child')) {
                 $finalScore += 10;
                 $reasons[] = "Includes Maternity/Child benefits";
             }
        }
        
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
     * Calculate weighted medical compatibility score
     */
    private function weightedMedicalCompatibility(array $userConditions, array $policyConditions, Policy $policy): float
    {
        // Define condition severity weights (higher = more critical)
        $conditionWeights = [
            'Cancer' => 10,
            'Heart Disease' => 9,
            'Kidney Failure' => 9,
            'Stroke' => 8,
            'Liver Disease' => 8,
            'Diabetes' => 7,
            'Hypertension' => 5,
            'Asthma' => 4,
            'Arthritis' => 3,
            'Thyroid' => 3,
        ];

        // Critical illness umbrella terms
        $criticalIllnessConditions = ['Heart Disease', 'Cancer', 'Kidney Failure', 'Stroke', 'Liver Disease'];
        $isGenericCritical = in_array('Critical Illness', $policyConditions);

        $totalWeight = 0;
        $coveredWeight = 0;

        foreach ($userConditions as $condition) {
            $weight = $conditionWeights[$condition] ?? 5; // Default weight for unlisted conditions
            $totalWeight += $weight;

            // Direct match
            if (in_array($condition, $policyConditions)) {
                $coveredWeight += $weight;
            }
            // Semantic match: "Critical Illness" covers specific critical conditions
            elseif ($isGenericCritical && in_array($condition, $criticalIllnessConditions)) {
                $coveredWeight += ($weight * 0.8); // 80% credit for umbrella coverage
            }
        }

        return $totalWeight > 0 ? min(1, $coveredWeight / $totalWeight) : 1.0;
    }


    // ============================
    // DIVERSE SELECTION STRATEGY
    // ============================
    
    /**
     * Select diverse recommendations across multiple dimensions
     */
    private function diverseSelection(Collection $scored, int $count = 3): Collection
    {
        if ($scored->count() <= $count) {
            return $scored;
        }

        // Always take the best fit
        $selected = collect([$scored->first()]);
        
        // Dimensions to diversify on
        $dimensions = ['company_id', 'insurance_type', 'waiting_period_days'];

        // Try to add diverse policies
        foreach ($scored->skip(1) as $policy) {
            if ($selected->count() >= $count) {
                break;
            }

            $isDiverse = $this->isDiversePolicy($policy, $selected, $dimensions);
            
            if ($isDiverse) {
                $selected->push($policy);
            }
        }

        // If we still don't have enough, add remaining top scorers
        if ($selected->count() < $count) {
            foreach ($scored->skip(1) as $policy) {
                if ($selected->count() >= $count) {
                    break;
                }
                
                if (!$selected->contains('id', $policy->id)) {
                    $selected->push($policy);
                }
            }
        }

        return $selected->values();
    }

    /**
     * Check if a policy is sufficiently different from already selected ones
     */
    private function isDiversePolicy(Policy $policy, Collection $selected, array $dimensions): bool
    {
        foreach ($selected as $existing) {
            $similarityCount = 0;
            
            foreach ($dimensions as $dimension) {
                // Handle different value types
                $policyValue = $policy->$dimension;
                $existingValue = $existing->$dimension;
                
                // For waiting period, consider ranges rather than exact match
                if ($dimension === 'waiting_period_days') {
                    $policyRange = $this->getWaitingPeriodRange($policyValue);
                    $existingRange = $this->getWaitingPeriodRange($existingValue);
                    
                    if ($policyRange === $existingRange) {
                        $similarityCount++;
                    }
                } else {
                    if ($policyValue === $existingValue) {
                        $similarityCount++;
                    }
                }
            }
            
            // If more than 1 dimension matches, consider it too similar
            if ($similarityCount > 1) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Categorize waiting period into ranges
     */
    private function getWaitingPeriodRange(?int $days): string
    {
        if ($days === null || $days === 0) return 'immediate';
        if ($days <= 30) return 'short';
        if ($days <= 90) return 'medium';
        return 'long';
    }


    // ============================
    // ORIGINAL SCORING ENGINE (Control)
    // ============================
    private function computeScore(Policy $policy, array $profile, array $popularityMap = [])
    {
        $age = $profile['age'];
        $healthScore = $profile['health_score'] ?? 70;
        $hasFamily = ($profile['family_members'] ?? 1) > 1;
        
        // Dynamic Weight Definition
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

        // Predictive Underwriting
        $approvalLikelihood = 'High';
        $underwritingPenalty = 0;
        
        $userCond = $profile['conditions'] ?? [];
        $policyExclusions = is_array($policy->exclusions) ? $policy->exclusions : [];

        $excludedMatches = array_intersect($userCond, $policyExclusions);
        if (!empty($excludedMatches)) {
            $approvalLikelihood = 'Very Low';
            $underwritingPenalty = 40;
            $reasons[] = "High risk of rejection due to policy exclusions";
        } 
        elseif ($healthScore < 45 && ($policy->waiting_period_days ?? 0) < 90) {
            $approvalLikelihood = 'Low';
            $underwritingPenalty = 20;
            $reasons[] = "Strict medical underwriting expected";
        }
        elseif ($healthScore > 85 && empty($userCond)) {
            $approvalLikelihood = 'Guaranteed';
            $reasons[] = "Instantly eligible for this plan";
        }

        // Medical Compatibility
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

        // Contract Quality
        $waitingDays = (int)($policy->waiting_period_days ?? 0);
        $copayPercent = (int)($policy->copay_percent ?? 0);
        $waitFactor = max(0, 1 - ($waitingDays / 365));
        $copayFactor = max(0, 1 - ($copayPercent / 20));
        $weightedScore += (($waitFactor * 0.7 + $copayFactor * 0.3) * $wFinePrint);
        if ($waitingDays <= 30) $reasons[] = "No-wait immediate coverage";

        // Budget Fit
        if ($profile['budget_range']) {
            $budget = $this->parseBudgetRange($profile['budget_range']);
            $max = $budget['max'];
            $isHighTier = in_array($profile['budget_range'], ['50k+', '50K+', '>30000', 'default']);
            
            if ($premium <= $max && $premium >= $max * 0.6) {
                $weightedScore += $wBudget;
                $reasons[] = "Maximizes your coverage capacity";
            } elseif ($premium < $max * 0.6) {
                $weightedScore += ($wBudget * 0.7);
                $reasons[] = $isHighTier ? "Well within your budget" : "Cost-effective choice";
            } elseif ($premium <= $max * 1.15) {
                $weightedScore += ($wBudget * 0.4);
                $reasons[] = "Premium quality (slightly above budget)";
            }
        } else {
            $weightedScore += $wBudget;
        }

        // Social Proof
        $popularity = $popularityMap[$policy->id] ?? 0;
        if ($popularity >= 3) {
            $weightedScore += $wSocial;
            $reasons[] = "Top choice for users in your age group";
        } elseif ($popularity >= 1 || ($popularityMap['is_global_top'] ?? false)) {
            $weightedScore += ($wSocial * 0.5);
            $reasons[] = "Community favorite";
        }

        // Provider Trust
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

        if ($age >= 24 && $age <= 40 && $hasFamily) {
             if (str_contains($policyName, 'maternity') || str_contains($policyName, 'child')) {
                 $finalScore += 10;
                 $reasons[] = "Includes Maternity/Child benefits";
             }
        }
        
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


    // ============================
    // ENHANCED COLLABORATIVE FILTERING
    // ============================
    
    /**
     * Multi-dimensional peer similarity with caching
     */
    private function getPeerPopularity(array $profile, ?User $currentUser): array
    {
        if (!$currentUser) {
            return $this->getGlobalPopularity();
        }

        $cacheKey = "peer_popularity_{$currentUser->id}";
        
        return Cache::remember($cacheKey, 1800, function() use ($profile, $currentUser) {
            // Find similar users using multi-dimensional distance
            $peerIds = $this->findSimilarUsers($currentUser, $profile);

            if ($peerIds->isEmpty()) {
                return $this->getGlobalPopularity();
            }

            // Count successful policy purchases in this peer group
            $popularityData = Payment::query()
                ->whereIn('user_id', $peerIds)
                ->where('is_verified', true)
                ->whereIn('status', ['success', 'paid', 'completed'])
                ->groupBy('policy_id')
                ->selectRaw('policy_id, count(*) as count')
                ->pluck('count', 'policy_id')
                ->toArray();

            return $popularityData;
        });
    }

    /**
     * Find users similar across multiple dimensions
     */
    private function findSimilarUsers(User $user, array $profile, int $limit = 50): Collection
    {
        $ageMin = max(1, $profile['age'] - 5);
        $ageMax = $profile['age'] + 5;
        
        // Multi-dimensional similarity query
        return User::query()
            ->where('id', '!=', $user->id)
            ->whereBetween('dob', [
                now()->subYears($ageMax)->toDateString(),
                now()->subYears($ageMin)->toDateString()
            ])
            ->where('is_smoker', $profile['is_smoker'])
            ->when($profile['region_type'] ?? null, function($q) use ($profile) {
                $q->where('region_type', $profile['region_type']);
            })
            ->when($profile['occupation_class'] ?? null, function($q) use ($profile) {
                $q->where('occupation_class', $profile['occupation_class']);
            })
            ->when(($profile['family_members'] ?? 1) > 1, function($q) use ($profile) {
                // Prioritize users with similar family size
                $q->whereBetween('family_members', [
                    max(1, $profile['family_members'] - 1),
                    $profile['family_members'] + 1
                ]);
            })
            ->limit($limit)
            ->pluck('id');
    }

    /**
     * Fallback to global popularity
     */
    private function getGlobalPopularity(): array
    {
        return Cache::remember('global_policy_popularity', 3600, function() {
            $data = Payment::query()
                ->where('is_verified', true)
                ->whereIn('status', ['success', 'paid', 'completed'])
                ->where('created_at', '>', now()->subMonths(6))
                ->groupBy('policy_id')
                ->selectRaw('policy_id, count(*) as count')
                ->orderByDesc('count')
                ->limit(10)
                ->pluck('count', 'policy_id')
                ->toArray();

            $data['is_global_top'] = true;
            return $data;
        });
    }


    // ============================
    // HELPER METHODS
    // ============================

    private function parseBudgetRange(?string $range)
    {
        return match ($range) {
            '< 5k/yr'     => ['min' => 0, 'max' => 5000],
            '5k-10k'      => ['min' => 5000, 'max' => 10000],
            '10k-20k'     => ['min' => 10000, 'max' => 20000],
            '20k-50k'     => ['min' => 20000, 'max' => 50000],
            '50k+', '50K+', '>30000' => ['min' => 50000, 'max' => 100000],
            default       => ['min' => 0, 'max' => 100000],
        };
    }
}
