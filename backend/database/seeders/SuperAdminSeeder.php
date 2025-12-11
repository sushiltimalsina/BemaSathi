<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::create([
            'name' => 'Super Admin',
            'phone' => '9800000000',
            'email' => 'superadmin@gmail.com',
            'password' => Hash::make('password'),
        ]);
    }
}
