<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'billing_cycle')) {
                $table->string('billing_cycle', 20)->nullable()->after('paid_at');
            }
            if (!Schema::hasColumn('payments', 'is_verified')) {
                $table->boolean('is_verified')->default(false)->after('billing_cycle');
            }
            if (!Schema::hasColumn('payments', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('is_verified');
            }
            if (!Schema::hasColumn('payments', 'failed_notified')) {
                $table->boolean('failed_notified')->default(false)->after('verified_at');
            }
            if (!Schema::hasColumn('payments', 'failed_notified_at')) {
                $table->timestamp('failed_notified_at')->nullable()->after('failed_notified');
            }
        });

        if (Schema::hasColumn('payments', 'status') && Schema::hasColumn('payments', 'is_verified')) {
            DB::table('payments')
                ->whereIn('status', ['success', 'paid', 'completed'])
                ->where('is_verified', false)
                ->update([
                    'is_verified' => true,
                    'verified_at' => DB::raw('COALESCE(verified_at, paid_at)'),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'failed_notified_at')) {
                $table->dropColumn('failed_notified_at');
            }
            if (Schema::hasColumn('payments', 'failed_notified')) {
                $table->dropColumn('failed_notified');
            }
            if (Schema::hasColumn('payments', 'verified_at')) {
                $table->dropColumn('verified_at');
            }
            if (Schema::hasColumn('payments', 'is_verified')) {
                $table->dropColumn('is_verified');
            }
            if (Schema::hasColumn('payments', 'billing_cycle')) {
                $table->dropColumn('billing_cycle');
            }
        });
    }
};
