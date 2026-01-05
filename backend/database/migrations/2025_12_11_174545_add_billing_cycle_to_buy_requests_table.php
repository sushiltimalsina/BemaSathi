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
            if (!Schema::hasColumn('buy_requests', 'billing_cycle')) {
                $table->enum('billing_cycle', ['monthly', 'quarterly', 'half_yearly', 'yearly'])
                    ->nullable()
                    ->after('policy_id');
            }
            if (!Schema::hasColumn('buy_requests', 'cycle_amount')) {
                $table->decimal('cycle_amount', 12, 2)->nullable()->after('billing_cycle');
            }
            if (!Schema::hasColumn('buy_requests', 'next_renewal_date')) {
                $table->date('next_renewal_date')->nullable()->after('cycle_amount');
            }
            if (!Schema::hasColumn('buy_requests', 'renewal_status')) {
                $table->enum('renewal_status', ['active', 'due', 'expired', 'cancelled'])
                    ->default('active')
                    ->after('next_renewal_date');
            }
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (Schema::hasColumn('buy_requests', 'renewal_status')) {
                $table->dropColumn('renewal_status');
            }
            if (Schema::hasColumn('buy_requests', 'next_renewal_date')) {
                $table->dropColumn('next_renewal_date');
            }
            if (Schema::hasColumn('buy_requests', 'cycle_amount')) {
                $table->dropColumn('cycle_amount');
            }
            if (Schema::hasColumn('buy_requests', 'billing_cycle')) {
                $table->dropColumn('billing_cycle');
            }
        });
    }
};
