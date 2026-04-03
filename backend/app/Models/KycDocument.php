<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class KycDocument extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'dob',
        'address',
        'province',
        'district',
        'municipality_type',
        'municipality_name',
        'ward_number',
        'street_address',
        'phone',
        'document_type',
        'document_number',
        'front_path',
        'back_path',
        'family_members',
        'status',
        'allow_edit',
        'remarks',
        'verified_at',
    ];

    protected $appends = ['hashed_id'];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    protected $casts = [
        'family_members' => 'array',
        'allow_edit' => 'boolean',
    ];

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
        // Unique salt for KYC
        $salt = 3141592; 
        return base64_encode(($this->id ^ $salt) . '-' . substr(md5($this->id), 0, 5));
    }

    public static function decodeId($hash)
    {
        try {
            $decoded = base64_decode($hash);
            if (!$decoded) return null;
            
            $parts = explode('-', $decoded);
            if (count($parts) < 2) return null;
            
            $salt = 3141592;
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
