<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;
use Illuminate\Auth\Passwords\CanResetPassword;
use App\Models\KycDocument;

class User extends Authenticatable implements MustVerifyEmail, CanResetPasswordContract
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens, CanResetPassword;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
  protected $fillable = [
    'name',
    'email',
    'phone',
    'address',
    'dob',
    'is_smoker',
    'budget_range',
    'coverage_type',
    'family_members',
    'family_member_details',
    'pre_existing_conditions',
    'password',
    'weight_kg',
    'height_cm',
    'occupation_class',
    'google_id',
    'avatar',
];


protected $casts = [
    'pre_existing_conditions' => 'array',
    'family_members' => 'integer',
    'family_member_details' => 'array',
    'is_smoker' => 'boolean',
];


    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
   protected $hidden = [
    'password',
    'remember_token',
    'api_token',
    'created_at',
    'updated_at',
];



    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function kycDocuments()
    {
        return $this->hasMany(KycDocument::class, 'user_id', 'id');
    }
}
