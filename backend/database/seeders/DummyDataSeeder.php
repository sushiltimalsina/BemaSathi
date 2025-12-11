<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Models\Company;
use App\Models\Agent;
use App\Models\Policy;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        DB::table('policies')->truncate();
        DB::table('agents')->truncate();
        DB::table('companies')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        $companiesData = [
            ['name' => 'Nepal Life Insurance',      'email' => 'info@nepallife.com',      'phone' => '9800000001', 'address' => 'Kathmandu', 'description' => 'Leading life insurer in Nepal'],
            ['name' => 'National Life Insurance',   'email' => 'contact@nationallife.com','phone' => '9800000002', 'address' => 'Kathmandu', 'description' => 'Trusted national insurer'],
            ['name' => 'Union Life Insurance',      'email' => 'hello@unionlife.com',     'phone' => '9800000003', 'address' => 'Kathmandu', 'description' => 'Comprehensive life and health plans'],
            ['name' => 'Prabhu Insurance',          'email' => 'support@prabhuinsurance.com', 'phone' => '9800000004', 'address' => 'Lalitpur', 'description' => 'Diversified insurance products'],
            ['name' => 'Shikhar Insurance',         'email' => 'service@shikhar.com',     'phone' => '9800000005', 'address' => 'Kathmandu', 'description' => 'Top-tier general insurer'],
            ['name' => 'Siddhartha Insurance',      'email' => 'care@siddharthainsurance.com','phone' => '9800000006', 'address' => 'Kathmandu', 'description' => 'Reliable general insurance'],
            ['name' => 'Himalayan Life Insurance',  'email' => 'team@himalayanlife.com',  'phone' => '9800000007', 'address' => 'Pokhara',   'description' => 'Life and health focused plans'],
            ['name' => 'IME Life Insurance',        'email' => 'info@imelife.com',        'phone' => '9800000008', 'address' => 'Lalitpur',  'description' => 'Customer-centric life insurance'],
        ];

        $companies = [];
        foreach ($companiesData as $data) {
            $companies[] = Company::create($data);
        }

        $agentNames = [
            'Aarav Shrestha', 'Sujita Koirala', 'Prakash Adhikari', 'Ritika Rana',
            'Sandeep Gautam', 'Nabin Thapa', 'Anisha Gurung', 'Bibek Sharma',
            'Kusum Poudel', 'Prabin Bhattarai'
        ];

        $agents = [];
        foreach ($agentNames as $idx => $name) {
            $company = $companies[array_rand($companies)];
            $agents[] = Agent::create([
                'name'       => $name,
                'phone'      => '9810' . str_pad((string)($idx + 1), 6, '0', STR_PAD_LEFT),
                'email'      => Str::slug($name, '.') . '@agents.nepal',
                'password'   => Hash::make(Str::random(12)),
                'company_id' => $company->id,
            ]);
        }

        $types = ['health', 'term-life', 'whole-life'];
        $coveredSets = [
            ['asthma', 'diabetes'],
            ['hypertension', 'heart'],
            ['asthma', 'heart', 'hypertension'],
            ['diabetes'],
            [],
        ];

        $policyNames = [
            'health' => [
                'Everest Health Shield', 'Himalaya Care Plus', 'Nepal Life Health Secure',
                'Prabhu Health Guard', 'Shikhar Medi Protect', 'Siddhartha Wellness Plan',
                'Union Health Prime', 'IME Lifeline Cover', 'National Health Advantage',
                'Himalayan Lifecare'
            ],
            'term-life' => [
                'Everest Term Protect', 'Himalaya Term Shield', 'Nepal Life Term Secure',
                'Prabhu Term Assure', 'Shikhar Term Advantage', 'Siddhartha Term Elite',
                'Union Term Guard', 'IME Term Plus', 'National Term Prime',
                'Himalayan Legacy Term'
            ],
            'whole-life' => [
                'Everest Lifetime Guard', 'Himalaya Lifetime Secure', 'Nepal Life Whole Shield',
                'Prabhu Lifetime Promise', 'Shikhar Lifelong Cover', 'Siddhartha Whole Protect',
                'Union Lifetime Advantage', 'IME Whole Prime', 'National Lifetime Care',
                'Himalayan Whole Elite'
            ],
        ];

        $policies = [];
        foreach ($types as $type) {
            $namesForType = $policyNames[$type] ?? [];
            foreach ($namesForType as $idx => $pName) {
                $company = $companies[array_rand($companies)];
                $agent   = $agents[array_rand($agents)];
                $premium = 9000 + ($idx * 900) + rand(0, 1200);
                $coverage = 600000 + ($idx * 80000);
                $rating = round((3.3 + ($idx * 0.07) + (rand(0, 12) / 100)), 1);
                $supportsSmokers = (bool) rand(0, 1);
                $covered = $coveredSets[array_rand($coveredSets)];
                $exclusions = ['cosmetic surgery', 'pre-existing within 2 years'];

                $policies[] = [
                    'insurance_type'         => $type,
                    'company_name'           => $company->name,
                    'policy_name'            => $pName,
                    'premium_amt'            => $premium,
                    'coverage_limit'         => $coverage,
                    'policy_description'     => "Comprehensive {$type} coverage with flexible benefits.",
                    'company_rating'         => min(5, $rating),
                    'agent_id'               => $agent->id,
                    'covered_conditions'     => json_encode($covered),
                    'supports_smokers'       => $supportsSmokers,
                    'waiting_period_days'    => rand(0, 45),
                    'copay_percent'          => rand(0, 20),
                    'exclusions'             => json_encode($exclusions),
                    'claim_settlement_ratio' => rand(9200, 9800) / 100,
                    'created_at'             => now(),
                    'updated_at'             => now(),
                ];
            }
        }

        Policy::insert($policies);
    }
}
