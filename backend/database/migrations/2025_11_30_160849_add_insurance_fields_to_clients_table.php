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
    Schema::table('clients', function (Blueprint $table) {
        $table->date('dob')->nullable();
        $table->string('budget_range')->nullable(); // <10000, 10000-20000, etc.
        $table->enum('coverage_type', ['individual', 'family'])->default('individual');
        $table->boolean('is_smoker')->default(false);
        $table->enum('pre_existing_condition', ['none', 'diabetes', 'heart', 'hypertension'])->default('none');
    });
}

public function down()
{
    Schema::table('clients', function (Blueprint $table) {
        $table->dropColumn(['dob', 'budget_range', 'coverage_type', 'is_smoker', 'pre_existing_condition']);
    });
}

};
