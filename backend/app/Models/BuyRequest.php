<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BuyRequest extends Model
{
    use SoftDeletes;

    protected $appends = ['hashed_id'];

    protected $fillable = [
        'user_id',
        'policy_id',
        'name',
        'phone',
        'email',
        'calculated_premium',
        'billing_cycle',
        'health_declaration',
        'cycle_amount',
        'next_renewal_date',
        'renewal_status',
        'renewal_reminder_sent_at',
        'renewal_grace_reminders_sent',
        'renewal_grace_last_sent_at',
    ];

    protected $dates = ['deleted_at'];

    protected $casts = [
        'cycle_amount' => 'float',
        'next_renewal_date' => 'date',
        'renewal_reminder_sent_at' => 'datetime',
        'renewal_grace_last_sent_at' => 'datetime',
        'health_declaration' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function policy()
    {
        return $this->belongsTo(Policy::class);
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
        $salt = 1852934; 
        return base64_encode(($this->id ^ $salt) . '-' . substr(md5($this->id), 0, 5));
    }

    public static function decodeId($hash)
    {
        try {
            $decoded = base64_decode($hash);
            if (!$decoded) return null;
            
            $parts = explode('-', $decoded);
            if (count($parts) < 2) return null;
            
            $salt = 1852934;
            $id = $parts[0] ^ $salt;
            
            if (substr(md5($id), 0, 5) !== $parts[1]) {
                return null;
            }
            
            return (int) $id;
        } catch (\Exception $e) {
            return null;
        }
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
