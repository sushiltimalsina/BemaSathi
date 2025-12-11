<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('purchase_requests', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('policy_id');

            $table->string('name');
            $table->string('phone', 30);
            $table->string('email')->nullable();

            $table->enum('status', ['pending', 'contacted', 'completed', 'cancelled'])
                ->default('pending');

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('policy_id')->references('id')->on('policies')->cascadeOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('purchase_requests');
    }
};
