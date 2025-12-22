<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_inquiries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('policy_id')->nullable()->constrained('policies')->nullOnDelete();
            $table->foreignId('agent_id')->nullable()->constrained('agents')->nullOnDelete();

            $table->string('user_name')->nullable();
            $table->string('user_email')->nullable();

            $table->string('policy_name')->nullable();
            $table->string('company_name')->nullable();
            $table->decimal('premium_amount', 12, 2)->nullable();
            $table->string('coverage_limit')->nullable();

            $table->string('agent_name')->nullable();
            $table->string('agent_email')->nullable();
            $table->string('agent_phone')->nullable();

            $table->timestamp('notified_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_inquiries');
    }
};
