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
        
        // 1. Actuarial Age Gradient (Continuous Math instead of Brackets)
        $age           = $this->normalizeAge($age, $extraContext);
        $ageFactor     = $this->calculateAgeSlope($age);
        
        // 2. Lifestyle & Health Multiplexing
        $smokerFactor  = $isSmoker ? 1.35 : 1.00; // Increased smoker risk to 35%
        $healthFactor  = $this->healthFactor($healthScore);
        
        // 3. Structural Factors
        $coverageFactor = $this->coverageFactor($coverageType, $familyMembers);
        
        // 4. Disease Loading [NEW]
        // Each chronic condition adds a 15% loading factor (Compounding Risk)
        $conditions = $extraContext['conditions'] ?? [];
        $diseaseLoading = 1.0 + (count($conditions) * 0.15);

        // 5. Regional & Loyalty Logic
        $regionalLoading = $this->getRegionalLoading($extraContext['city'] ?? 'default');
        $loyaltyDiscount = ($extraContext['is_existing_customer'] ?? false) ? 0.95 : 1.00;

        // 6. Advanced Actuarial Risk: BMI & Occupation [MASTER LEVEL]
        $bmiFactor = $this->calculateBMIContext($extraContext['weight'] ?? null, $extraContext['height'] ?? null);
        $occFactor = match($extraContext['occupation_class'] ?? 'class_1') {
            'class_2' => 1.15, // Field Sales / Drivers
            'class_3' => 1.30, // Manual Labor / Construction
            default   => 1.00  // Office / Desk Job
        };

        // The Grand Formula
        $calculated = round(
            $basePremium * $ageFactor * $smokerFactor * $healthFactor * $coverageFactor * $diseaseLoading * $regionalLoading * $loyaltyDiscount * $bmiFactor * $occFactor,
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
            'loyalty_discount' => $loyaltyDiscount,
            'calculated_total' => $calculated,
        ];
    }

    private function normalizeAge(?int $age, array $extraContext = []): int
    {
        // Actuarial Standard: In family plans, risk is based on the ELDEST member.
        if (!empty($extraContext['family_ages']) && is_array($extraContext['family_ages'])) {
            $maxAge = max($extraContext['family_ages']);
            $age = $maxAge > 0 ? $maxAge : $age;
        }

        if (!$age || $age < 1 || $age > 120) {
            return 30; // statistical median
        }
        return $age;
    }

    /**
     * Calculates age risk using a linear-exponential hybrid slope.
     * Professionals avoid "cliff" pricing (where turning 30 suddenly costs 20% more).
     */
    private function calculateAgeSlope(int $age): float
    {
        // Actuarial 'U-Curve' Logic:
        // 1. Infants (0-2): Higher risk due to fragile health/vaccinations.
        if ($age <= 2) return 1.10;

        // 2. Children/Teens (3-17): The "Golden Age" of health (lowest risk).
        if ($age < 18) return 0.80;

        // 3. Adults (18+): Linear risk accumulation
        // Base risk starts at 1.0 for age 18.
        // Every year after 25 adds a 2.5% risk increment.
        if ($age < 25) return 1.0;
        
        $incrementalRisk = ($age - 25) * 0.025;
        $totalRisk = 1.0 + $incrementalRisk;

        // Cap risk factor at 2.5x for very old applicants
        return min($totalRisk, 2.50);
    }

    private function healthFactor(?int $score): float
    {
        if ($score === null) return 1.05;
        $score = max(1, min(100, $score));

        // Using a parabolic curve for health (optimal is 100)
        if ($score >= 90) return 0.85; // Athlete/Excellent
        if ($score >= 75) return 0.95; // Fit
        if ($score >= 50) return 1.10; // Average
        return 1.40; // High Risk
    }

    private function getRegionalLoading(string $city): float
    {
        $loadingMap = [
            'Kathmandu' => 1.10, // Higher medical costs in capital
            'Lalitpur' => 1.05,
            'Pokhara' => 1.05,
            'default' => 1.00
        ];

        return $loadingMap[$city] ?? 1.00;
    }

    private function coverageFactor(?string $coverage, ?int $familyMembers): float
    {
        if ($coverage !== 'family') return 1.00;

        $members = max(2, min(10, $familyMembers ?? 2));
        // Incremental cost per family member decreases (Economy of scale)
        return 1.20 + (($members - 2) * 0.08);
    }

    private function calculateBMIContext(?float $weight, ?int $heightCm): float
    {
        if (!$weight || !$heightCm) return 1.0;

        // BMI = weight (kg) / height (m)^2
        $heightM = $heightCm / 100;
        $bmi = $weight / ($heightM * $heightM);

        return match(true) {
            $bmi < 18.5 => 1.00, // Underweight (Neutral)
            $bmi <= 24.9 => 1.00, // Normal (Standard)
            $bmi <= 29.9 => 1.10, // Overweight (10% Loading)
            default      => 1.25  // Obese (25% Loading)
        };
    }
}
