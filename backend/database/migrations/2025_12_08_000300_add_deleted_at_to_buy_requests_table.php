<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('buy_requests', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('buy_requests', function (Blueprint $table) {
            if (Schema::hasColumn('buy_requests', 'deleted_at')) {
                $table->dropColumn('deleted_at');
            }
        });
    }
};
