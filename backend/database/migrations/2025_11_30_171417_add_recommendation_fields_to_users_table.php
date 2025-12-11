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
            if (!Schema::hasColumn('users', 'dob')) {
                $table->date('dob')->nullable()->after('address');
            }
            if (!Schema::hasColumn('users', 'budget_range')) {
                $table->string('budget_range')->nullable()->after('dob');
            }
            if (!Schema::hasColumn('users', 'coverage_type')) {
                $table->enum('coverage_type', ['individual', 'family'])->default('individual')->after('budget_range');
            }
            if (!Schema::hasColumn('users', 'is_smoker')) {
                $table->boolean('is_smoker')->default(false)->after('coverage_type');
            }
            if (!Schema::hasColumn('users', 'pre_existing_conditions')) {
                $table->json('pre_existing_conditions')->nullable()->after('is_smoker');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'pre_existing_conditions')) {
                $table->dropColumn('pre_existing_conditions');
            }
            if (Schema::hasColumn('users', 'is_smoker')) {
                $table->dropColumn('is_smoker');
            }
            if (Schema::hasColumn('users', 'coverage_type')) {
                $table->dropColumn('coverage_type');
            }
            if (Schema::hasColumn('users', 'budget_range')) {
                $table->dropColumn('budget_range');
            }
            if (Schema::hasColumn('users', 'dob')) {
                $table->dropColumn('dob');
            }
        });
    }
};
