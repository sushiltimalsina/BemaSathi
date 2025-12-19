<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('policies', 'is_active')) {
            Schema::table('policies', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('claim_settlement_ratio');
            });
        }

        if (!Schema::hasColumn('agents', 'is_active')) {
            Schema::table('agents', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('company_id');
            });
        }

        if (!Schema::hasColumn('companies', 'is_active')) {
            Schema::table('companies', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('agent_id');
            });
        }
    }

    public function down(): void
    {
        Schema::table('policies', function (Blueprint $table) {
            if (Schema::hasColumn('policies', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });

        Schema::table('agents', function (Blueprint $table) {
            if (Schema::hasColumn('agents', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });

        Schema::table('companies', function (Blueprint $table) {
            if (Schema::hasColumn('companies', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};
