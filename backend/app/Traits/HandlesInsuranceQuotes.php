<?php

namespace App\Traits;

use App\Models\User;
use App\Models\Policy;
use App\Services\PremiumCalculator;
use Illuminate\Support\Carbon;

trait HandlesInsuranceQuotes
{
    /**
     * Resolve a standardized health/risk profile for a user.
     */
    protected function resolveStandardProfile(User $user)
    {
        $kyc = $user->kycDocuments()->where('status', 'approved')->latest()->first();

        // Standardized DOB Priority: Verified KYC > Profile DOB
        $dob = $kyc?->dob ?? $user->dob;
        $age = ($dob ? Carbon::parse($dob)->age : 30);

        // Geography
        $regionType = $user->region_type ?? 'urban';
        $city = $user->municipality_name ?? $user->address ?? 'default';

        // Family demographics
        $familyDetails = $user->family_member_details ?? [];
        $familyAges = [];
        $hasSeniors = false;
        
        if (is_array($familyDetails)) {
            foreach ($familyDetails as $member) {
                if (isset($member['dob'])) {
                    try {
                        $mAge = Carbon::parse($member['dob'])->age;
                        $familyAges[] = $mAge;
                        if ($mAge > 55) $hasSeniors = true;
                    } catch (\Exception $e) {}
                }
            }
        }
        $familyAges[] = $age; // Include self

        return [
            'age' => max(1, min(120, $age)),
            'city' => $city,
            'region_type' => $regionType,
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

    protected function getPersonalizedPremium(PremiumCalculator $calculator, Policy $policy, array $profile)
    {
        return $calculator->quote(
            $policy,
            $profile['age'],
            $profile['is_smoker'],
            $profile['health_score'],
            $profile['coverage_type'],
            $profile['budget_range'],
            $profile['family_members'],
            [
                'city' => $profile['city'], 
                'region_type' => $profile['region_type'],
                'weight' => $profile['weight'],
                'height' => $profile['height'],
                'occupation_class' => $profile['occupation_class'],
                'conditions' => $profile['conditions'],
                'family_ages' => $profile['family_ages']
            ]
        )['calculated_total'];
    }
}
