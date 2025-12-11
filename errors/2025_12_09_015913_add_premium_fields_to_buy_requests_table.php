<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            $table->integer('age')->nullable()->after('agent_id');
            $table->boolean('is_smoker')->default(false)->after('age');
            $table->integer('health_score')->nullable()->after('is_smoker');
            $table->decimal('calculated_premium', 12, 2)->nullable()->after('health_score');
        });
    }

    public function down(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            $table->dropColumn(['age', 'is_smoker', 'health_score', 'calculated_premium']);
        });
    }
};
