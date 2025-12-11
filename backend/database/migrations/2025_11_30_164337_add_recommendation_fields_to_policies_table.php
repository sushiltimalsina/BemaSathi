<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('policies', function (Blueprint $table) {

            // JSON array for multiple conditions
            $table->json('covered_conditions')->nullable();

            // True/false for smoker support
            $table->boolean('supports_smokers')->default(true);
        });
    }

    public function down()
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn([
                'covered_conditions',
                'supports_smokers',
            ]);
        });
    }
};
