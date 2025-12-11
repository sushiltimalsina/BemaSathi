<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;


class Notification extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'message',
        'is_read',
        'buy_request_id',
        'policy_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
