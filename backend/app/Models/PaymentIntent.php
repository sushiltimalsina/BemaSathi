<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentIntent extends Model
{
    protected $fillable = [
        'user_id',
        'policy_id',
        'buy_request_id',
        'email',
        'name',
        'phone',
        'billing_cycle',
        'calculated_premium',
        'cycle_amount',
        'amount',
        'currency',
        'next_renewal_date',
        'renewal_status',
        'status',
        'expires_at',
        'meta',
    ];

    protected $casts = [
        'calculated_premium' => 'decimal:2',
        'cycle_amount' => 'decimal:2',
        'amount' => 'decimal:2',
        'next_renewal_date' => 'date',
        'expires_at' => 'datetime',
        'meta' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }

    public function buyRequest()
    {
        return $this->belongsTo(BuyRequest::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
