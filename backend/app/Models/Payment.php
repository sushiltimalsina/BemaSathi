<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $appends = ['hashed_id'];

    protected $fillable = [
        'user_id',
        'buy_request_id',
        'payment_intent_id',
        'policy_id',
        'amount',
        'currency',
        'method',
        'provider',
        'provider_reference',
        'status',
        'meta',
        'paid_at',
        'billing_cycle',
        'is_verified',
        'verified_at',
        'failed_notified',
        'failed_notified_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'paid_at' => 'datetime',
        'is_verified' => 'boolean',
        'verified_at' => 'datetime',
        'failed_notified' => 'boolean',
        'failed_notified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function buyRequest()
    {
        return $this->belongsTo(BuyRequest::class);
    }

    public function paymentIntent()
    {
        return $this->belongsTo(PaymentIntent::class);
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
        $salt = 9421873; 
        return base64_encode(($this->id ^ $salt) . '-' . substr(md5($this->id), 0, 5));
    }

    public static function decodeId($hash)
    {
        try {
            $decoded = base64_decode($hash);
            if (!$decoded) return null;
            
            $parts = explode('-', $decoded);
            if (count($parts) < 2) return null;
            
            $salt = 9421873;
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
