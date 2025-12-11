<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kyc_documents', function (Blueprint $table) {
            // Drop the old FK to clients if it exists, then point to users.id
            if (Schema::hasColumn('kyc_documents', 'user_id')) {
                $table->dropForeign(['user_id']);
                $table->foreign('user_id')
                    ->references('id')
                    ->on('users')
                    ->cascadeOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('kyc_documents', function (Blueprint $table) {
            if (Schema::hasColumn('kyc_documents', 'user_id')) {
                $table->dropForeign(['user_id']);
                $table->foreign('user_id')
                    ->references('id')
                    ->on('clients')
                    ->cascadeOnDelete();
            }
        });
    }
};
