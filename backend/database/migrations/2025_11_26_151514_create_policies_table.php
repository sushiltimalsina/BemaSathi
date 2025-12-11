<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
{
    Schema::create('policies', function (Blueprint $table) {
        $table->id();
        $table->string('insurance_type');
        $table->string('company_name');
        $table->integer('premium_amt');
        $table->integer('coverage_limit');
        $table->text('policy_description')->nullable();
        $table->float('company_rating')->default(0);
        $table->integer('waiting_period_days')->nullable();
        $table->integer('copay_percent')->nullable();
        $table->json('exclusions')->nullable();
        $table->decimal('claim_settlement_ratio', 5, 2)->nullable();

        $table->timestamps();
    });

    }

    public function down(): void {
        Schema::dropIfExists('policies');
    }
};
