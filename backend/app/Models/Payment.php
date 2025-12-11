<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'user_id',
        'buy_request_id',
        'policy_id',
        'amount',
        'currency',
        'method',
        'provider',
        'provider_reference',
        'status',
        'meta',
        'paid_at',
    ];

    protected $casts = [
        'meta' => 'array',
        'paid_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function buyRequest()
    {
        return $this->belongsTo(BuyRequest::class);
    }

    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }
}
