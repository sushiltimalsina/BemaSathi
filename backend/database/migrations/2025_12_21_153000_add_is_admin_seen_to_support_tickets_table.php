<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('support_tickets', 'is_admin_seen')) {
            Schema::table('support_tickets', function (Blueprint $table) {
                $table->boolean('is_admin_seen')->default(false)->after('status');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('support_tickets', 'is_admin_seen')) {
            Schema::table('support_tickets', function (Blueprint $table) {
                $table->dropColumn('is_admin_seen');
            });
        }
    }
};
