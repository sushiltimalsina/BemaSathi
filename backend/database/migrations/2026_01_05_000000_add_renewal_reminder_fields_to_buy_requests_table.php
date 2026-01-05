<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('buy_requests', 'renewal_reminder_sent_at')) {
                $table->timestamp('renewal_reminder_sent_at')->nullable()->after('renewal_status');
            }
            if (!Schema::hasColumn('buy_requests', 'renewal_grace_reminders_sent')) {
                $table->unsignedTinyInteger('renewal_grace_reminders_sent')
                    ->default(0)
                    ->after('renewal_reminder_sent_at');
            }
            if (!Schema::hasColumn('buy_requests', 'renewal_grace_last_sent_at')) {
                $table->timestamp('renewal_grace_last_sent_at')
                    ->nullable()
                    ->after('renewal_grace_reminders_sent');
            }
        });
    }

    public function down(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (Schema::hasColumn('buy_requests', 'renewal_grace_last_sent_at')) {
                $table->dropColumn('renewal_grace_last_sent_at');
            }
            if (Schema::hasColumn('buy_requests', 'renewal_grace_reminders_sent')) {
                $table->dropColumn('renewal_grace_reminders_sent');
            }
            if (Schema::hasColumn('buy_requests', 'renewal_reminder_sent_at')) {
                $table->dropColumn('renewal_reminder_sent_at');
            }
        });
    }
};
