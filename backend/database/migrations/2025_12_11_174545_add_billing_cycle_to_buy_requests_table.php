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
    $table->enum('billing_cycle', ['monthly', 'quarterly', 'half_yearly', 'yearly'])->nullable()->after('policy_id');
    $table->decimal('cycle_amount', 12, 2)->nullable()->after('billing_cycle');
    $table->date('next_renewal_date')->nullable()->after('cycle_amount');
    $table->enum('renewal_status', ['active', 'due', 'expired', 'cancelled'])
        ->default('active')
        ->after('next_renewal_date');
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            //
        });
    }
};
