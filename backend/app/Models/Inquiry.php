<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inquiry extends Model
{
    protected $fillable = [
        'user_id',
        'policy_id',
        'name',
        'phone',
        'email',
        'message'
    ];

    public function policy()
    {
        return $this->belongsTo(\App\Models\Policy::class, 'policy_id');
    }
}
