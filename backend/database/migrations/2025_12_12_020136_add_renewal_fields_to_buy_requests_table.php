<?php

// database/migrations/xxxx_xx_xx_xxxxxx_add_renewal_fields_to_buy_requests_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('buy_requests', 'billing_cycle')) {
                $table->enum('billing_cycle', ['monthly','quarterly','half_yearly','yearly'])
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
                $table->enum('renewal_status', ['active','due','expired','cancelled'])
                    ->default('active')
                    ->after('next_renewal_date');
            }
        });
    }
    public function down(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            $table->dropColumn(['billing_cycle','cycle_amount','next_renewal_date','renewal_status']);
        });
    }
};

