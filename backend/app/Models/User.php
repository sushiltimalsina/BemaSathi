<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Auth\Passwords\CanResetPassword;
use App\Models\KycDocument;

class User extends Authenticatable implements MustVerifyEmail, CanResetPasswordContract
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, CanResetPassword;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
  protected $fillable = [
    'name',
    'email',
    'phone',
    'address',
    'dob',
    'is_smoker',
    'budget_range',
    'coverage_type',
    'family_members',
    'family_member_details',
    'pre_existing_conditions',
    'password',
    'weight_kg',
    'height_cm',
    'occupation_class',
    'health_score',
    'province',
    'district',
    'municipality_type',
    'municipality_name',
    'ward_number',
    'street_address',
    'region_type',
    'google_id',
    'avatar',
];


    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'pre_existing_conditions' => 'array',
            'family_members' => 'integer',
            'family_member_details' => 'array',
            'is_smoker' => 'boolean',
            'health_score' => 'integer',
        ];
    }

    protected $appends = ['hashed_id'];

    public function ratings()
    {
        return $this->hasMany(Rating::class);
    }

    public function kycDocuments()
    {
        return $this->hasMany(KycDocument::class, 'user_id', 'id');
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
        // Unique salt for User
        $salt = 8571426; 
        return base64_encode(($this->id ^ $salt) . '-' . substr(md5($this->id), 0, 5));
    }

    public static function decodeId($hash)
    {
        try {
            $decoded = base64_decode($hash);
            if (!$decoded) return null;
            
            $parts = explode('-', $decoded);
            if (count($parts) < 2) return null;
            
            $salt = 8571426;
            $id = $parts[0] ^ $salt;
            
            if (substr(md5($id), 0, 5) !== $parts[1]) {
                return null;
            }
            
            return (int) $id;
        } catch (\Exception $e) {
            return null;
        }
    }
}
