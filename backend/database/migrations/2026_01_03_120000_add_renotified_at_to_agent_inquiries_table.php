<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('agent_inquiries', 'renotified_at')) {
            Schema::table('agent_inquiries', function (Blueprint $table) {
                $table->timestamp('renotified_at')->nullable()->after('notified_at');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('agent_inquiries', 'renotified_at')) {
            Schema::table('agent_inquiries', function (Blueprint $table) {
                $table->dropColumn('renotified_at');
            });
        }
    }
};
