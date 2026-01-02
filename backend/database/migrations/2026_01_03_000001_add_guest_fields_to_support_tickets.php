<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('support_tickets', function (Blueprint $table) {
            if (!Schema::hasColumn('support_tickets', 'guest_name')) {
                $table->string('guest_name')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('support_tickets', 'guest_email')) {
                $table->string('guest_email')->nullable()->after('guest_name');
            }
            if (!Schema::hasColumn('support_tickets', 'guest_phone')) {
                $table->string('guest_phone')->nullable()->after('guest_email');
            }
        });

        if (Schema::hasColumn('support_tickets', 'user_id')) {
            DB::statement('ALTER TABLE support_tickets MODIFY user_id BIGINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('support_tickets', 'user_id')) {
            DB::statement('ALTER TABLE support_tickets MODIFY user_id BIGINT UNSIGNED NOT NULL');
        }

        Schema::table('support_tickets', function (Blueprint $table) {
            if (Schema::hasColumn('support_tickets', 'guest_phone')) {
                $table->dropColumn('guest_phone');
            }
            if (Schema::hasColumn('support_tickets', 'guest_email')) {
                $table->dropColumn('guest_email');
            }
            if (Schema::hasColumn('support_tickets', 'guest_name')) {
                $table->dropColumn('guest_name');
            }
        });
    }
};
