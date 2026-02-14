<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kyc_documents', function (Blueprint $table) {
            $table->string('province')->nullable()->after('address');
            $table->string('district')->nullable()->after('province');
            $table->string('municipality_type')->nullable()->after('district');
            $table->string('municipality_name')->nullable()->after('municipality_type');
            $table->string('ward_number')->nullable()->after('municipality_name');
            $table->string('street_address')->nullable()->after('ward_number');
        });
    }

    public function down(): void
    {
        Schema::table('kyc_documents', function (Blueprint $table) {
            $table->dropColumn([
                'province',
                'district',
                'municipality_type',
                'municipality_name',
                'ward_number',
                'street_address'
            ]);
        });
    }
};
