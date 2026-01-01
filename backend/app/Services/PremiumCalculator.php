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
        ?int $familyMembers = null
    ): array
    {
        $basePremium   = (float) ($policy->premium_amt ?? 0);
        $age           = $this->normalizeAge($age);
        $ageFactor     = $this->ageFactor($age);
        $smokerFactor  = $isSmoker ? 1.30 : 1.00;
        $healthFactor  = $this->healthFactor($healthScore);
        $coverageFactor = $this->coverageFactor($coverageType, $familyMembers);
        $budgetFactor   = $this->budgetFactor($budgetRange);

        $calculated = round(
            $basePremium * $ageFactor * $smokerFactor * $healthFactor * $coverageFactor * $budgetFactor,
            2
        );

        return [
            'policy_id'        => $policy->id,
            'base_premium'     => $basePremium,
            'age'              => $age,
            'age_factor'       => $ageFactor,
            'smoker_factor'    => $smokerFactor,
            'health_factor'    => $healthFactor,
            'coverage_factor'  => $coverageFactor,
            'budget_factor'    => $budgetFactor,
            'family_members'   => $familyMembers,
            'calculated_total' => $calculated,
        ];
    }

    private function normalizeAge(?int $age): int
    {
        if (!$age || $age < 1 || $age > 120) {
            return 30; // safe default
        }
        return $age;
    }

    /**
     * Age-based multiplier logic.
     */
    private function ageFactor(int $age): float
    {
        return match (true) {
            $age <= 29 => 1.00,
            $age <= 45 => 1.25,
            $age <= 60 => 1.60,
            default     => 2.00, // 60+ highest risk
        };
    }

    /**
     * Health score calculation.
     */
    private function healthFactor(?int $score): float
    {
        if ($score === null) {
            return 1.05; // unknown = slight uplift
        }

        // Out-of-range protection
        $score = max(1, min(100, $score));

        return match (true) {
            $score >= 86 => 0.90, // excellent health
            $score >= 71 => 1.00, // good health
            $score >= 41 => 1.20, // average
            default      => 1.50, // high risk
        };
    }

    private function coverageFactor(?string $coverage, ?int $familyMembers): float
    {
        if ($coverage !== 'family') {
            return 1.00;
        }

        $members = $familyMembers ?? 2;
        $members = max(2, min(20, $members));
        $factor = 1.20 + (max(0, $members - 2) * 0.10);
        return min($factor, 1.60);
    }

    private function budgetFactor(?string $budget): float
    {
        return match ($budget) {
            '<10000' => 0.90,
            '10000-20000', '10000 - 20000' => 1.00,
            '20000-30000', '20000 - 30000' => 1.05,
            default   => 1.10, // higher budget or unknown slightly uplift
        };
    }
}
