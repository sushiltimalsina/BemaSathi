<?php
// database/migrations/xxxx_xx_xx_xxxxxx_add_payment_fields_to_purchase_requests_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->after('policy_id');
            $table->string('payment_status')->default('pending')->after('payment_method');
            $table->string('transaction_id')->nullable()->after('payment_status');
            $table->decimal('paid_amount', 12, 2)->nullable()->after('transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'payment_status', 'transaction_id', 'paid_amount']);
        });
    }
};

