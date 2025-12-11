<?php

namespace App\Models;

use App\Services\WeightedScoring;
use App\Services\RecommendationRules;
use Illuminate\Support\Collection;

class RecommendationService
{
    public function __construct(
        protected WeightedScoring $scoring,
        protected RecommendationRules $rules
    ) {
    }

    /**
     * @param \Illuminate\Support\Collection<Policy> $policies
     * @param array $preferences
     */
    public function getBestPolicy(Collection $policies, array $preferences = []): ?Policy
    {
        if ($policies->isEmpty()) {
            return null;
        }

        $scored = $this->scoring->scorePolicies($policies);

        return $this->rules->pickBest($scored, $preferences);
    }
}
