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
        Schema::table('policies', function (Blueprint $table) {
            $table->renameColumn('region_ktm_factor', 'region_urban_factor');
            $table->renameColumn('region_ltp_factor', 'region_semi_urban_factor');
            $table->renameColumn('region_pkr_factor', 'region_rural_factor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->renameColumn('region_urban_factor', 'region_ktm_factor');
            $table->renameColumn('region_semi_urban_factor', 'region_ltp_factor');
            $table->renameColumn('region_rural_factor', 'region_pkr_factor');
        });
    }
};
