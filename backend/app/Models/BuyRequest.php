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
    ];

    protected $dates = ['deleted_at'];

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
}
