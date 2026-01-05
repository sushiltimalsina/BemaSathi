<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentInquiry extends Model
{
    protected $fillable = [
        'user_id',
        'policy_id',
        'agent_id',
        'user_name',
        'user_email',
        'policy_name',
        'company_name',
        'premium_amount',
        'coverage_limit',
        'agent_name',
        'agent_email',
        'agent_phone',
        'notified_at',
        'renotified_at',
    ];

    protected $casts = [
        'premium_amount' => 'decimal:2',
        'notified_at' => 'datetime',
        'renotified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }
}
