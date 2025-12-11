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
    Schema::create('notifications', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('user_id')->nullable();
        $table->string('title');
        $table->text('message')->nullable();
        $table->boolean('is_read')->default(false);

        // Optional referencing
        $table->unsignedBigInteger('buy_request_id')->nullable();
        $table->unsignedBigInteger('policy_id')->nullable();

        $table->timestamps();
    });
}

};
