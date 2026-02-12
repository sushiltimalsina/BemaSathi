<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('weight_kg', 5, 2)->nullable()->after('family_member_details');
            $table->integer('height_cm')->nullable()->after('weight_kg');
            $table->string('occupation_class')->default('class_1')->after('height_cm'); // class_1 (Office), class_2 (Field), class_3 (Manual)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['weight_kg', 'height_cm', 'occupation_class']);
        });
    }
};
