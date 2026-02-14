<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('province')->nullable()->after('phone');
            $table->string('district')->nullable()->after('province');
            $table->string('municipality_type')->nullable()->after('district'); // Metropolitan, Sub-Metropolitan, Municipality, Rural Municipality
            $table->string('municipality_name')->nullable()->after('municipality_type');
            $table->string('ward_number')->nullable()->after('municipality_name');
            $table->string('street_address')->nullable()->after('ward_number');
            $table->string('region_type')->nullable()->after('street_address'); // Calculated: urban, semi_urban, rural
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'province',
                'district',
                'municipality_type',
                'municipality_name',
                'ward_number',
                'street_address',
                'region_type'
            ]);
        });
    }
};
