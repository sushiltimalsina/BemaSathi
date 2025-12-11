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
        Schema::table('buy_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('buy_requests', 'name')) {
                $table->string('name')->nullable()->after('policy_id');
            }

            if (!Schema::hasColumn('buy_requests', 'phone')) {
                $table->string('phone')->nullable()->after('name');
            }

            if (!Schema::hasColumn('buy_requests', 'email')) {
                $table->string('email')->nullable()->after('phone');
            }

            if (!Schema::hasColumn('buy_requests', 'agent_id')) {
                $table->unsignedBigInteger('agent_id')->nullable()->after('status');
                $table->foreign('agent_id')->references('id')->on('agents')->onDelete('set null');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (Schema::hasColumn('buy_requests', 'agent_id')) {
                $table->dropForeign(['agent_id']);
                $table->dropColumn('agent_id');
            }
            if (Schema::hasColumn('buy_requests', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('buy_requests', 'phone')) {
                $table->dropColumn('phone');
            }
            if (Schema::hasColumn('buy_requests', 'name')) {
                $table->dropColumn('name');
            }
        });
    }
};
