<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'payment_intent_id')) {
                $table->foreignId('payment_intent_id')
                    ->nullable()
                    ->after('buy_request_id')
                    ->constrained('payment_intents')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            if (Schema::hasColumn('payments', 'payment_intent_id')) {
                $table->dropForeign(['payment_intent_id']);
                $table->dropColumn('payment_intent_id');
            }
        });
    }
};
