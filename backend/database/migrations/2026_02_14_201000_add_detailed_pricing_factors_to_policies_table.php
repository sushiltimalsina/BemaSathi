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
            $table->decimal('age_factor_step', 8, 4)->default(0.0250)->after('premium_factor');
            $table->decimal('smoker_factor', 8, 2)->default(1.35)->after('age_factor_step');
            $table->decimal('condition_factor', 8, 2)->default(0.15)->after('smoker_factor');
            $table->decimal('family_base_factor', 8, 2)->default(1.20)->after('condition_factor');
            $table->decimal('family_member_step', 8, 2)->default(0.08)->after('family_base_factor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn([
                'age_factor_step',
                'smoker_factor',
                'condition_factor',
                'family_base_factor',
                'family_member_step'
            ]);
        });
    }
};
