<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Policy extends Model
{
    use HasFactory;

    protected $table = 'policies';

    protected $appends = ['hashed_id'];

    protected $fillable = [
        'insurance_type',
        'company_name',
        'policy_name',
        'premium_amt',
        'coverage_limit',
        'policy_description',
        'company_rating',
        'admin_rating',
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

    public function userRatings()
    {
        return $this->hasMany(Rating::class);
    }

    public function agents()
    {
        return $this->belongsToMany(Agent::class, 'policy_agent');
    }

    /**
     * Override to support both numeric and hashed IDs in route model binding.
     */
    public function resolveRouteBinding($value, $field = null)
    {
        if (is_numeric($value)) {
            return $this->where($field ?? $this->getRouteKeyName(), $value)->first();
        }

        $decodedId = self::decodeId($value);
        if ($decodedId) {
            return $this->where($field ?? $this->getRouteKeyName(), $decodedId)->first();
        }

        return null;
    }

    public function getHashedIdAttribute()
    {
        // Simple XOR obfuscation to create "encrypted" ID
        $salt = 7355608; // Choose any large prime or constant
        return base64_encode(($this->id ^ $salt) . '-' . substr(md5($this->id), 0, 5));
    }

    public static function decodeId($hash)
    {
        try {
            $decoded = base64_decode($hash);
            if (!$decoded) return null;
            
            $parts = explode('-', $decoded);
            if (count($parts) < 2) return null;
            
            $salt = 7355608;
            $id = $parts[0] ^ $salt;
            
            // Validate checksum (optional but good)
            if (substr(md5($id), 0, 5) !== $parts[1]) {
                return null;
            }
            
            return (int) $id;
        } catch (\Exception $e) {
            return null;
        }
    }
}
