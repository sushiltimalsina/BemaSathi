<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\AgentInquiry;

class Agent extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'email',
        'password',
        'company_id',
        'is_active',
    ];

    protected $hidden = [
        'password'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function agentInquiries()
    {
        return $this->hasMany(AgentInquiry::class);
    }
}
?>
