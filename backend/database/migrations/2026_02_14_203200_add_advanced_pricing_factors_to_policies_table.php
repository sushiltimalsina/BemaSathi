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
            // Regional Factors
            $table->decimal('region_ktm_factor', 8, 2)->default(1.10)->after('age_25_plus_base_factor');
            $table->decimal('region_ltp_factor', 8, 2)->default(1.05)->after('region_ktm_factor');
            $table->decimal('region_pkr_factor', 8, 2)->default(1.05)->after('region_ltp_factor');
            
            // Loyalty & Health
            $table->decimal('loyalty_discount_factor', 8, 2)->default(0.95)->after('region_pkr_factor');
            $table->decimal('bmi_overweight_factor', 8, 2)->default(1.10)->after('loyalty_discount_factor');
            $table->decimal('bmi_obese_factor', 8, 2)->default(1.25)->after('bmi_overweight_factor');
            
            // Occupation Factors
            $table->decimal('occ_class_2_factor', 8, 2)->default(1.15)->after('bmi_obese_factor');
            $table->decimal('occ_class_3_factor', 8, 2)->default(1.30)->after('occ_class_2_factor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn([
                'region_ktm_factor',
                'region_ltp_factor',
                'region_pkr_factor',
                'loyalty_discount_factor',
                'bmi_overweight_factor',
                'bmi_obese_factor',
                'occ_class_2_factor',
                'occ_class_3_factor'
            ]);
        });
    }
};
