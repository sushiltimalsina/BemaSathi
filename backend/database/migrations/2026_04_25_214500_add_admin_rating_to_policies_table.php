<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->float('admin_rating')->default(0)->after('company_rating');
        });
    }

    public function down()
    {
        Schema::table('policies', function (Blueprint $table) {
            $table->dropColumn('admin_rating');
        });
    }
};
