<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'description',
        'agent_id',
    ];

    public function agent()
    {
        return $this->belongsTo(\App\Models\Agent::class, 'agent_id');
    }
}

