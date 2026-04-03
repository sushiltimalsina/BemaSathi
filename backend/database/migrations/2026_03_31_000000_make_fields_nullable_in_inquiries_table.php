<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('inquiries', function (Blueprint $table) {
            $table->unsignedBigInteger('policy_id')->nullable()->change();
            $table->string('phone')->nullable()->change();
            $table->text('message')->nullable(false)->change();
            $table->string('email')->nullable(false)->change();
        });
    }

    public function down()
    {
        Schema::table('inquiries', function (Blueprint $table) {
            $table->unsignedBigInteger('policy_id')->nullable(false)->change();
            $table->string('phone')->nullable(false)->change();
            $table->text('message')->nullable()->change();
            $table->string('email')->nullable()->change();
        });
    }
};
