<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('payments', 'payment_type')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->string('payment_type')->nullable()->after('status');
            });
        }

        $payments = DB::table('payments')
            ->whereNotNull('buy_request_id')
            ->orderBy('created_at')
            ->get(['id', 'buy_request_id']);

        $firstByRequest = [];
        foreach ($payments as $payment) {
            if (!isset($firstByRequest[$payment->buy_request_id])) {
                $firstByRequest[$payment->buy_request_id] = $payment->id;
            }
        }

        foreach ($payments as $payment) {
            $type = ($firstByRequest[$payment->buy_request_id] ?? null) === $payment->id
                ? 'new'
                : 'renewal';

            DB::table('payments')
                ->where('id', $payment->id)
                ->update(['payment_type' => $type]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('payments', 'payment_type')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropColumn('payment_type');
            });
        }
    }
};
