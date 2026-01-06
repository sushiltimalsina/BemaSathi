<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_intents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('policy_id')->nullable()->constrained('policies')->nullOnDelete();
            $table->foreignId('buy_request_id')->nullable()->constrained('buy_requests')->nullOnDelete();

            $table->string('email')->nullable();
            $table->string('name')->nullable();
            $table->string('phone')->nullable();
            $table->string('billing_cycle')->default('yearly');
            $table->decimal('calculated_premium', 12, 2)->nullable();
            $table->decimal('cycle_amount', 12, 2)->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('NPR');
            $table->date('next_renewal_date')->nullable();
            $table->string('renewal_status', 20)->default('active');
            $table->string('status', 20)->default('pending');
            $table->timestamp('expires_at')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_intents');
    }
};
