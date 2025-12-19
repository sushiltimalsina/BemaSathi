<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'admin_id',
        'admin_name',
        'event',
        'category',
        'description',
    ];
}
