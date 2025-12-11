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
        $table->unsignedBigInteger('agent_id')->nullable()->after('company_rating');
    });
}

public function down()
{
    Schema::table('policies', function (Blueprint $table) {
        $table->dropColumn('agent_id');
    });
}

};
