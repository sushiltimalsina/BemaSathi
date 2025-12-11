<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kyc_documents', function (Blueprint $table) {
            $table->id();

            // Correct FK: users.id
            $table->foreignId('user_id')
                  ->constrained('users', 'id')
                  ->cascadeOnDelete();

            // Auto-filled fields
            $table->string('full_name')->nullable();
            $table->date('dob')->nullable();
            $table->string('address')->nullable();
            $table->string('phone')->nullable();

            // Document info
            $table->string('document_type')->default('citizenship');
            $table->string('document_number')->nullable();

            // Front & Back image paths
            $table->string('front_path');
            $table->string('back_path');

            // Verification status
            $table->enum('status', ['pending', 'approved', 'rejected'])
                  ->default('pending');

            $table->text('remarks')->nullable();
            $table->timestamp('verified_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kyc_documents');
    }
};
