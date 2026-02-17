<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recommendation_feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('policy_id')->constrained()->onDelete('cascade');
            $table->integer('position')->comment('Position in recommendation list (1, 2, 3)');
            $table->decimal('match_score', 5, 2)->nullable();
            $table->string('variant', 50)->default('control')->comment('A/B test variant');
            $table->boolean('clicked')->default(false);
            $table->boolean('purchased')->default(false);
            $table->integer('time_spent_seconds')->nullable();
            $table->timestamp('shown_at');
            $table->timestamps();

            // Indexes for performance
            $table->index(['policy_id', 'clicked', 'purchased']);
            $table->index(['user_id', 'shown_at']);
            $table->index('variant');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recommendation_feedback');
    }
};
