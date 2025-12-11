<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Policy;

class PolicySeeder extends Seeder
{
    public function run()
    {
        $policies = [

            // -------------------------
            // HEALTH INSURANCE
            // -------------------------
            [
                'insurance_type' => 'health',
                'company_name' => 'Nepal Life Insurance',
                'policy_name' => 'Health Gold Plan',
                'premium_amt' => 12000,
                'coverage_limit' => 200000,
                'policy_description' => 'Best selling health policy with high coverage and low premium.',
                'company_rating' => 4.5,
                'agent_id' => 1,

                'covered_conditions' => ['diabetes', 'hypertension'],
                'supports_smokers' => true,

                'waiting_period_days' => 30,
                'copay_percent' => 10,
                'exclusions' => ['cosmetic surgery', 'fertility treatment'],
                'claim_settlement_ratio' => 96.5,
            ],
            [
                'insurance_type' => 'health',
                'company_name' => 'MetLife Nepal',
                'policy_name' => 'Health Silver Plan',
                'premium_amt' => 14000,
                'coverage_limit' => 150000,
                'policy_description' => 'Affordable health plan with good hospital coverage.',
                'company_rating' => 4.0,
                'agent_id' => 1,

                'covered_conditions' => ['asthma'],
                'supports_smokers' => false,

                'waiting_period_days' => 45,
                'copay_percent' => 15,
                'exclusions' => ['dental', 'maternity'],
                'claim_settlement_ratio' => 92.8,
            ],

            // -------------------------
            // TERM LIFE
            // -------------------------
            [
                'insurance_type' => 'term-life',
                'company_name' => 'IME Life Insurance',
                'policy_name' => 'Term Shield 1 Crore',
                'premium_amt' => 8000,
                'coverage_limit' => 10000000,
                'policy_description' => 'High-value term protection plan for families.',
                'company_rating' => 4.3,
                'agent_id' => 1,

                'covered_conditions' => ['heart'],
                'supports_smokers' => true,

                'waiting_period_days' => 15,
                'copay_percent' => 0,
                'exclusions' => ['alcohol-related claims'],
                'claim_settlement_ratio' => 97.2,
            ],
            [
                'insurance_type' => 'term-life',
                'company_name' => 'LIC Nepal',
                'policy_name' => 'LIC Long Term Protect',
                'premium_amt' => 6000,
                'coverage_limit' => 5000000,
                'policy_description' => 'Budget-friendly long term protection.',
                'company_rating' => 4.8,
                'agent_id' => 1,

                'covered_conditions' => [],
                'supports_smokers' => false,

                'waiting_period_days' => 10,
                'copay_percent' => 5,
                'exclusions' => ['suicide first year'],
                'claim_settlement_ratio' => 98.5,
            ],

            // -------------------------
            // WHOLE LIFE
            // -------------------------
            [
                'insurance_type' => 'whole-life',
                'company_name' => 'Prime Life Insurance',
                'policy_name' => 'Whole Life Secure',
                'premium_amt' => 20000,
                'coverage_limit' => 2500000,
                'policy_description' => 'Lifetime coverage with guaranteed returns.',
                'company_rating' => 4.6,
                'agent_id' => 1,

                'covered_conditions' => ['hypertension'],
                'supports_smokers' => true,

                'waiting_period_days' => 60,
                'copay_percent' => 10,
                'exclusions' => ['self-inflicted injury'],
                'claim_settlement_ratio' => 95.9,
            ],
            [
                'insurance_type' => 'whole-life',
                'company_name' => 'Citizen Life',
                'policy_name' => 'Citizen Whole Life Premium',
                'premium_amt' => 18000,
                'coverage_limit' => 2000000,
                'policy_description' => 'Affordable whole life plan.',
                'company_rating' => 4.1,
                'agent_id' => 1,

                'covered_conditions' => [],
                'supports_smokers' => false,

                'waiting_period_days' => 75,
                'copay_percent' => 20,
                'exclusions' => ['critical illness not covered'],
                'claim_settlement_ratio' => 90.2,
            ],
        ];

        foreach ($policies as $p) {
            Policy::create($p);
        }
    }
}
