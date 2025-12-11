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
        Schema::table('buy_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('buy_requests', 'age')) {
                $table->unsignedInteger('age')->nullable()->after('policy_id');
            }

            if (!Schema::hasColumn('buy_requests', 'is_smoker')) {
                $table->boolean('is_smoker')->default(false)->after('age');
            }

            if (!Schema::hasColumn('buy_requests', 'health_score')) {
                $table->unsignedInteger('health_score')->nullable()->after('is_smoker');
            }

            if (!Schema::hasColumn('buy_requests', 'calculated_premium')) {
                $table->decimal('calculated_premium', 10, 2)->nullable()->after('health_score');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (Schema::hasColumn('buy_requests', 'calculated_premium')) {
                $table->dropColumn('calculated_premium');
            }
            if (Schema::hasColumn('buy_requests', 'health_score')) {
                $table->dropColumn('health_score');
            }
            if (Schema::hasColumn('buy_requests', 'is_smoker')) {
                $table->dropColumn('is_smoker');
            }
            if (Schema::hasColumn('buy_requests', 'age')) {
                $table->dropColumn('age');
            }
        });
    }
};
