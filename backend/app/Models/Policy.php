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
    ];

    protected $casts = [
        'covered_conditions' => 'array',
        'supports_smokers' => 'boolean',
        'exclusions' => 'array',
        'waiting_period_days' => 'integer',
        'copay_percent' => 'integer',
        'claim_settlement_ratio' => 'decimal:2',
    ];

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }
}
