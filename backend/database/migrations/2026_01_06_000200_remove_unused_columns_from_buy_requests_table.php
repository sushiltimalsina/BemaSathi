<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (Schema::hasColumn('buy_requests', 'agent_id')) {
                $table->dropForeign(['agent_id']);
                $table->dropColumn('agent_id');
            }
            if (Schema::hasColumn('buy_requests', 'status')) {
                $table->dropColumn('status');
            }
            if (Schema::hasColumn('buy_requests', 'notes')) {
                $table->dropColumn('notes');
            }
            if (Schema::hasColumn('buy_requests', 'age')) {
                $table->dropColumn('age');
            }
            if (Schema::hasColumn('buy_requests', 'is_smoker')) {
                $table->dropColumn('is_smoker');
            }
            if (Schema::hasColumn('buy_requests', 'health_score')) {
                $table->dropColumn('health_score');
            }
        });
    }

    public function down(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('buy_requests', 'status')) {
                $table->string('status')->default('pending')->after('email');
            }
            if (!Schema::hasColumn('buy_requests', 'agent_id')) {
                $table->unsignedBigInteger('agent_id')->nullable()->after('status');
                $table->foreign('agent_id')->references('id')->on('agents')->onDelete('set null');
            }
        });
    }
};
