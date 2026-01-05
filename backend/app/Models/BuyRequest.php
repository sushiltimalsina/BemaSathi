<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BuyRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'policy_id',
        'name',
        'phone',
        'email',
        'status',
        'agent_id',
        'age',
        'is_smoker',
        'health_score',
        'calculated_premium',
        'billing_cycle',
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
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }

    public function agent()
    {
        return $this->belongsTo(Agent::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
