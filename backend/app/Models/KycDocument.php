<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class KycDocument extends Model
{
    protected $fillable = [
        'user_id',
        'full_name',
        'dob',
        'address',
        'phone',
        'document_type',
        'document_number',
        'front_path',
        'back_path',
        'status',
        'remarks',
        'verified_at',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
