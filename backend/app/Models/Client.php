<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'policy_id',
        'policy_provided',
    ];

    protected $casts = [
        'policy_provided' => 'boolean',
    ];

    public function policy()
    {
        return $this->belongsTo(\App\Models\Policy::class, 'policy_id');
    }
}

