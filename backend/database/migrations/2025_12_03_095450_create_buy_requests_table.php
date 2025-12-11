<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        if (Schema::hasTable('buy_requests')) {
            // Table already exists from earlier migration; skip creation.
            return;
        }

        Schema::create('buy_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('policy_id');

            $table->string('name');
            $table->string('phone');
            $table->string('email')->nullable();

            $table->enum('status', ['pending', 'processing', 'assigned', 'completed', 'rejected'])
                  ->default('pending');

            $table->unsignedBigInteger('agent_id')->nullable();

            $table->timestamps();

            // Align ownership with users table to match controllers/model
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('policy_id')->references('id')->on('policies')->onDelete('cascade');
            $table->foreign('agent_id')->references('id')->on('agents')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::dropIfExists('buy_requests');
    }
};
