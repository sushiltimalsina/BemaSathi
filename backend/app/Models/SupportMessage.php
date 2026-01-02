<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupportMessage extends Model
{
    protected $fillable = [
        'ticket_id',
        'user_id',
        'admin_id',
        'message',
        'is_admin',
        'is_user_seen',
        'is_admin_seen',
    ];

    protected $casts = [
        'is_admin' => 'boolean',
        'is_user_seen' => 'boolean',
        'is_admin_seen' => 'boolean',
    ];

    public function ticket()
    {
        return $this->belongsTo(SupportTicket::class, 'ticket_id');
    }
}
