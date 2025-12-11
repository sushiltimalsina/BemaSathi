<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Agent extends Model
{
    protected $fillable = [
        'name',
        'phone',
        'email',
        'password',
        'company_id',
    ];

    protected $hidden = [
        'password'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function buyRequests()
    {
        return $this->hasMany(BuyRequest::class);
    }
}
?>
