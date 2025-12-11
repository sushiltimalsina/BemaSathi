<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SavedPolicy extends Model
{
    protected $fillable = ['user_id', 'policy_id'];

    public function policy()
    {
        return $this->belongsTo(Policy::class);
    }
}
