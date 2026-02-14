<?php

namespace App\Http\Controllers;

use App\Models\Policy;
use App\Services\PremiumCalculator;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

class PolicyController extends Controller
{
    public function __construct(private PremiumCalculator $calculator) {}

    public function index(Request $request)
    {
        $user = auth('sanctum')->user();
        $policies = Policy::query()
            ->when(Schema::hasColumn('policies', 'is_active'), function ($query) {
                $query->where('is_active', true);
            })
            ->get();

        $profile = $user ? $this->resolveProfile($user) : null;

        $policies = $policies->map(function ($policy) use ($profile, $user) {

            if ($user && $profile) {
                $policy->personalized_premium = $this->calculator->quote(
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
                )['calculated_total'];
            } else {
                $policy->personalized_premium = $policy->premium_amt;
            }

            return $policy;
        });

        return response()->json($policies->values());
    }


    public function show(Request $request, $id)
    {
        $policyQuery = Policy::query();
        if (Schema::hasColumn('policies', 'is_active')) {
            $policyQuery->where('is_active', true);
        }
        $policy = $policyQuery->findOrFail($id);
        $user = auth('sanctum')->user();

        $profile = $user ? $this->resolveProfile($user) : null;

        if ($profile) {
                $policy->personalized_premium = $this->calculator->quote(
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
                )['calculated_total'];
        } else {
            $policy->personalized_premium = $policy->premium_amt;
        }

        return response()->json($policy);
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

        $profile = $this->resolveProfile($user);
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


    private function resolveProfile($user)
    {
        $kyc = $user->kycDocuments()->where('status', 'approved')->latest()->first();

        $dob = $user->dob ?? $kyc?->dob;
        $age = ($dob ? Carbon::parse($dob)->age : 30);

        return [
            'age' => max(1, min(120, $age)),
            'is_smoker' => (bool)$user->is_smoker,
            'health_score' => $user->health_score ?? 70,
            'coverage_type' => $user->coverage_type ?? 'individual',
            'budget_range' => $user->budget_range,
            'family_members' => $user->family_members ?? 1,
            'region_type' => $user->region_type ?? 'urban',
            'city' => $user->municipality_name ?? $user->address,
            'weight' => $user->weight_kg,
            'height' => $user->height_cm,
            'occupation_class' => $user->occupation_class ?? 'class_1',
            'conditions' => is_array($user->pre_existing_conditions)
                ? $user->pre_existing_conditions
                : json_decode($user->pre_existing_conditions ?? '[]', true)
        ];
    }
}
