<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PurchaseRequest extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'policy_id',
        'name',
        'phone',
        'email',
        'status',          // pending, contacted, completed, cancelled
    ];

    /**
     * Default values for new purchase requests
     */
    protected $attributes = [
        'status' => 'pending',
    ];

    /**
     * Cast database fields to PHP types
     */
    protected $casts = [
        'user_id'   => 'integer',
        'policy_id' => 'integer',
        'status'    => 'string',
    ];

    /**
     * Relation: PurchaseRequest belongs to a policy
     */
    public function policy()
    {
        return $this->belongsTo(\App\Models\Policy::class, 'policy_id');
    }

    /**
     * Relation: PurchaseRequest belongs to a user
     */
    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
