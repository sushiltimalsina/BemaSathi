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
            $table->decimal('age_0_2_factor', 8, 2)->default(1.10)->after('age_factor_step');
            $table->decimal('age_3_17_factor', 8, 2)->default(0.80)->after('age_0_2_factor');
            $table->decimal('age_18_24_factor', 8, 2)->default(1.00)->after('age_3_17_factor');
            $table->decimal('age_25_plus_base_factor', 8, 2)->default(1.00)->after('age_18_24_factor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn([
                'age_0_2_factor',
                'age_3_17_factor',
                'age_18_24_factor',
                'age_25_plus_base_factor'
            ]);
        });
    }
};
