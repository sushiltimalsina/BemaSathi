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
                    $profile['budget_range']
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
                $profile['budget_range']
            )['calculated_total'];
        } else {
            $policy->personalized_premium = $policy->premium_amt;
        }

        return response()->json($policy);
    }


    private function resolveProfile($user)
    {
        $kyc = $user->kycDocuments()->where('status', 'approved')->latest()->first();

        $dob = $kyc?->dob ?? $user->dob;
        $age = ($dob ? Carbon::parse($dob)->age : 30);

        return [
            'age' => max(1, min(120, $age)),
            'is_smoker' => (bool)$user->is_smoker,
            'health_score' => $user->health_score ?? 70,
            'coverage_type' => $user->coverage_type ?? 'individual',
            'budget_range' => $user->budget_range
        ];
    }
}
