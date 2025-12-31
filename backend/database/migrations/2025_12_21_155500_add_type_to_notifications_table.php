<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('notifications', 'type')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->string('type', 50)->default('system')->after('policy_id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('notifications', 'type')) {
            Schema::table('notifications', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
    }
};
