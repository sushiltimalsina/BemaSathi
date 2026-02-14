<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Policy extends Model
{
    use HasFactory;

    protected $table = 'policies';

    protected $fillable = [
        'insurance_type',
        'company_name',
        'policy_name',
        'premium_amt',
        'coverage_limit',
        'policy_description',
        'company_rating',
        'agent_id',
        'covered_conditions',
        'supports_smokers',
        'waiting_period_days',
        'copay_percent',
        'exclusions',
        'claim_settlement_ratio',
        'is_active',
        'premium_factor',
        'age_factor_step',
        'smoker_factor',
        'condition_factor',
        'family_base_factor',
        'family_member_step',
        'age_0_2_factor',
        'age_3_17_factor',
        'age_18_24_factor',
        'age_25_plus_base_factor',
        'region_urban_factor',
        'region_semi_urban_factor',
        'region_rural_factor',
        'loyalty_discount_factor',
        'bmi_overweight_factor',
        'bmi_obese_factor',
        'occ_class_2_factor',
        'occ_class_3_factor',
    ];

    protected $casts = [
        'covered_conditions' => 'array',
        'supports_smokers' => 'boolean',
        'exclusions' => 'array',
        'waiting_period_days' => 'integer',
        'copay_percent' => 'integer',
        'claim_settlement_ratio' => 'decimal:2',
        'is_active' => 'boolean',
        'premium_factor' => 'float',
        'age_factor_step' => 'float',
        'smoker_factor' => 'float',
        'condition_factor' => 'float',
        'family_base_factor' => 'float',
        'family_member_step' => 'float',
        'age_0_2_factor' => 'float',
        'age_3_17_factor' => 'float',
        'age_18_24_factor' => 'float',
        'age_25_plus_base_factor' => 'float',
        'region_urban_factor' => 'float',
        'region_semi_urban_factor' => 'float',
        'region_rural_factor' => 'float',
        'loyalty_discount_factor' => 'float',
        'bmi_overweight_factor' => 'float',
        'bmi_obese_factor' => 'float',
        'occ_class_2_factor' => 'float',
        'occ_class_3_factor' => 'float',
    ];

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }

    public function agents()
    {
        return $this->belongsToMany(Agent::class, 'policy_agent');
    }
}
