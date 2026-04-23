<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use App\Services\PremiumCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class PolicyController extends Controller
{
    use \App\Traits\HandlesInsuranceQuotes;

    public function __construct(private PremiumCalculator $calculator) {}

    public function index(Request $request)
    {
        $user = auth('sanctum')->user();
        $policies = Policy::query()
            ->when(Schema::hasColumn('policies', 'is_active'), function ($query) {
                $query->where('is_active', true);
            })
            ->get();

        $profile = $user ? $this->resolveStandardProfile($user) : null;

        $policies = $policies->map(function ($policy) use ($profile, $user) {

            if ($user && $profile) {
                $policy->personalized_premium = $this->getPersonalizedPremium(
                    $this->calculator,
                    $policy,
                    $profile
                );
            } else {
                $policy->personalized_premium = $policy->premium_amt;
            }

            // Compute realistic premium range for guest display.
            // Min profile: young (25), healthy (score=95), non-smoker, individual, no conditions.
            // Max profile: older (58), lower health (score=40), smoker, family of 4, 2 conditions.
            $minQuote = $this->calculator->quote(
                $policy,
                25,          // age
                false,       // non-smoker
                95,          // health score (best tier)
                'individual',
                null,
                1,
                ['region_type' => 'rural', 'conditions' => [], 'occupation_class' => 'class_1']
            );
            $maxQuote = $this->calculator->quote(
                $policy,
                68,          // age
                true,        // smoker
                38,          // health score (worst tier → ×1.40)
                'family',
                null,
                4,           // 4 family members
                ['region_type' => 'urban', 'conditions' => ['Diabetes', 'Hypertension'], 'occupation_class' => 'class_2']
            );

            $policy->premium_min = $minQuote['calculated_total'];
            $policy->premium_max = $maxQuote['calculated_total'];

            return $policy;
        });

        return response()->json($policies->values());
    }


    public function show(Policy $policy)
    {
        $user = auth('sanctum')->user();
        $profile = $user ? $this->resolveStandardProfile($user) : null;

        if ($profile && $user) {
            $policy->personalized_premium = $this->getPersonalizedPremium(
                $this->calculator,
                $policy,
                $profile
            );
        } else {
            $policy->personalized_premium = $policy->premium_amt;
        }

        return response()->json($policy->load('agents', 'agent'));
    }

    /**
     * Calculate a premium quote using explicit inputs or the user's profile.
     */
    public function calculatePremium(Request $request)
    {
        $data = $request->validate([
            'policy_id' => 'required|exists:policies,id',
            'age' => 'nullable|integer|min:1|max:120',
            'dob' => 'nullable|date|before:today',
            'is_smoker' => 'nullable|boolean',
            'health_score' => 'nullable|integer|min:1|max:100',
            'coverage_type' => 'nullable|in:individual,family',
            'budget_range' => 'nullable|string',
            'family_members' => 'nullable|integer|min:1|max:20',
        ]);

        $policy = Policy::findOrFail($data['policy_id']);
        $user = auth('sanctum')->user();

        // resolveStandardProfile() requires a User model; fall back to neutral defaults for guests.
        $profile = $user
            ? $this->resolveStandardProfile($user)
            : [
                'age'              => 30,
                'city'             => 'default',
                'region_type'      => 'urban',
                'is_smoker'        => false,
                'health_score'     => 70,
                'coverage_type'    => 'individual',
                'budget_range'     => null,
                'family_members'   => 1,
                'family_ages'      => [30],
                'has_seniors'      => false,
                'weight'           => null,
                'height'           => null,
                'occupation_class' => 'class_1',
                'conditions'       => [],
            ];
        if (!empty($data['dob'])) {
            $profile['age'] = Carbon::parse($data['dob'])->age;
        }
        if (!empty($data['age'])) {
            $profile['age'] = (int) $data['age'];
        }
        if (array_key_exists('is_smoker', $data)) {
            $profile['is_smoker'] = (bool) $data['is_smoker'];
        }
        if (array_key_exists('health_score', $data)) {
            $profile['health_score'] = $data['health_score'];
        }
        if (!empty($data['coverage_type'])) {
            $profile['coverage_type'] = $data['coverage_type'];
        }
        if (!empty($data['budget_range'])) {
            $profile['budget_range'] = $data['budget_range'];
        }
        if (!empty($data['family_members'])) {
            $profile['family_members'] = (int) $data['family_members'];
        }

        $quote = $this->calculator->quote(
            $policy,
            $profile['age'],
            $profile['is_smoker'],
            $profile['health_score'],
            $profile['coverage_type'],
            $profile['budget_range'],
            $profile['family_members'],
            [
                'region_type' => $profile['region_type'], 
                'city' => $profile['city'],
                'weight' => $profile['weight'],
                'height' => $profile['height'],
                'occupation_class' => $profile['occupation_class'],
                'conditions' => $profile['conditions']
            ]
        );

        return response()->json([
            'success' => true,
            'quote' => $quote,
        ]);
    }


}
