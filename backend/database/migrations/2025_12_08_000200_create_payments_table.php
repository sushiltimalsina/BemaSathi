<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('buy_request_id')
                ->nullable()
                ->constrained('buy_requests')
                ->nullOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('policy_id')
                ->nullable()
                ->constrained('policies')
                ->nullOnDelete();

            // Payment fields
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('NPR');
            $table->string('method', 20)->default('esewa');

            // eSewa transaction reference
            $table->string('provider')->default('eSewa');
            $table->string('provider_reference')->nullable();

            // Status: pending / completed / failed
            $table->string('status', 20)->default('pending');

            // Raw response & extra logs
            $table->json('meta')->nullable();

            $table->timestamp('paid_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
