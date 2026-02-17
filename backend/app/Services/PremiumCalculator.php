<?php

namespace App\Services;

use App\Models\Policy;

class PremiumCalculator
{
    /**
     * Main premium calculation logic.
     */
    public function quote(
        Policy $policy,
        ?int $age,
        bool $isSmoker,
        ?int $healthScore = null,
        ?string $coverageType = null,
        ?string $budgetRange = null,
        ?int $familyMembers = null,
        array $extraContext = []
    ): array
    {
        $basePremium   = (float) ($policy->premium_amt ?? 0);
        
        // 1. Actuarial Age Gradient
        $age           = $this->normalizeAge($age, $extraContext);
        $ageFactor     = $this->calculateAgeSlope(
            $age, 
            (float)($policy->age_factor_step ?? 0.025),
            (float)($policy->age_0_2_factor ?? 1.10),
            (float)($policy->age_3_17_factor ?? 0.80),
            (float)($policy->age_18_24_factor ?? 1.00),
            (float)($policy->age_25_plus_base_factor ?? 1.00)
        );
        
        // 2. Lifestyle & Health Multiplexing
        $smokerFactor  = $isSmoker ? (float)($policy->smoker_factor ?? 1.35) : 1.00;
        $healthFactor  = $this->healthFactor($healthScore);
        
        // 3. Structural Factors
        $coverageFactor = $this->coverageFactor(
            $coverageType, 
            $familyMembers, 
            (float)($policy->family_base_factor ?? 1.20),
            (float)($policy->family_member_step ?? 0.08)
        );
        
        // 4. Disease Loading
        $conditions = $extraContext['conditions'] ?? [];
        $condFactor = (float)($policy->condition_factor ?? 0.15);
        $diseaseLoading = 1.0 + (count($conditions) * $condFactor);

        // 5. Regional & Loyalty Logic
        // Prioritize explicit region type (urban/semi_urban/rural), fallback to city
        $regionOrCity = $extraContext['region_type'] ?? $extraContext['city'] ?? 'default';
        $regionalLoading = $this->getRegionalLoading($regionOrCity, $policy);
        
        // 6. Advanced Actuarial Risk: BMI & Occupation
        $bmiFactor = $this->calculateBMIContext(
            $extraContext['weight'] ?? null, 
            $extraContext['height'] ?? null,
            $policy
        );
        
        $occFactor = match($extraContext['occupation_class'] ?? 'class_1') {
            'class_2' => (float)($policy->occ_class_2_factor ?? 1.15),
            'class_3' => (float)($policy->occ_class_3_factor ?? 1.30),
            default   => 1.00 
        };

        // The Grand Formula
        $calculated = round(
            $basePremium * $ageFactor * $smokerFactor * $healthFactor * $coverageFactor * $diseaseLoading * $regionalLoading * $bmiFactor * $occFactor * ($policy->premium_factor ?? 1.0),
            2
        );

        return [
            'policy_id'        => $policy->id,
            'base_premium'     => $basePremium,
            'age'              => $age,
            'age_factor'       => $ageFactor,
            'smoker_factor'    => $smokerFactor,
            'health_factor'    => $healthFactor,
            'disease_loading'  => $diseaseLoading,
            'bmi_loading'      => $bmiFactor,
            'occupation_load'  => $occFactor,
            'calculated_total' => $calculated,
        ];
    }

    private function normalizeAge(?int $age, array $extraContext = []): int
    {
        if (!empty($extraContext['family_ages']) && is_array($extraContext['family_ages'])) {
            $maxAge = max($extraContext['family_ages']);
            $age = $maxAge > 0 ? $maxAge : $age;
        }

        if (!$age || $age < 1 || $age > 120) {
            return 30;
        }
        return $age;
    }

    private function calculateAgeSlope(
        int $age, 
        float $step = 0.025,
        float $factor0_2 = 1.10,
        float $factor3_17 = 0.80,
        float $factor18_24 = 1.00,
        float $factor25PlusBase = 1.00
    ): float
    {
        if ($age <= 2) return $factor0_2;
        if ($age < 18) return $factor3_17;
        if ($age < 25) return $factor18_24;
        
        $incrementalRisk = ($age - 25) * $step;
        $totalRisk = $factor25PlusBase + $incrementalRisk;

        return min($totalRisk, 2.50);
    }

    private function healthFactor(?int $score): float
    {
        if ($score === null) return 1.05;
        $score = max(1, min(100, $score));

        if ($score >= 90) return 0.85;
        if ($score >= 75) return 0.95;
        if ($score >= 50) return 1.10;
        return 1.40;
    }

    private function getRegionalLoading(?string $location, Policy $policy): float
    {
        $normalized = strtolower($location ?? 'default');
        
        // Match specific categories first
        if ($normalized === 'urban') {
            return (float)($policy->region_urban_factor ?? 1.10);
        }
        if (in_array($normalized, ['semi_urban', 'semi-urban', 'semiurban'])) {
            return (float)($policy->region_semi_urban_factor ?? 1.05);
        }
        if ($normalized === 'rural') {
            return (float)($policy->region_rural_factor ?? 1.00);
        }

        // City-to-Category Mapping
        $cityMap = [
            'kathmandu' => (float)($policy->region_urban_factor ?? 1.10),
            'lalitpur'  => (float)($policy->region_semi_urban_factor ?? 1.05),
            'pokhara'   => (float)($policy->region_semi_urban_factor ?? 1.05),
            'default'   => 1.00
        ];

        return $cityMap[$normalized] ?? 1.00;
    }

    private function coverageFactor(?string $coverage, ?int $familyMembers, float $base = 1.20, float $step = 0.08): float
    {
        if ($coverage !== 'family') return 1.00;
        $members = max(2, min(10, $familyMembers ?? 2));
        return $base + (($members - 2) * $step);
    }

    private function calculateBMIContext(?float $weight, ?int $heightCm, Policy $policy): float
    {
        if (!$weight || !$heightCm) return 1.0;

        $heightM = $heightCm / 100;
        $bmi = $weight / ($heightM * $heightM);

        return match(true) {
            $bmi < 18.5 => 1.00,
            $bmi <= 24.9 => 1.00,
            $bmi <= 29.9 => (float)($policy->bmi_overweight_factor ?? 1.10),
            default      => (float)($policy->bmi_obese_factor ?? 1.25)
        };
    }
}
