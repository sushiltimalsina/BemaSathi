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
    Schema::table('policies', function (Blueprint $table) {
        if (!Schema::hasColumn('policies', 'policy_name')) {
            $table->string('policy_name')->after('company_name');
        }
    });

    Schema::table('policies', function (Blueprint $table) {
        $table->unique(['company_name', 'policy_name']);
    });
}

public function down()
{
    Schema::table('policies', function (Blueprint $table) {
        if (Schema::hasColumn('policies', 'policy_name')) {
            $table->dropColumn('policy_name');
        }
    });
}

};
