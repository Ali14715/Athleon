<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('alamat_user', function (Blueprint $table) {
            if (!Schema::hasColumn('alamat_user', 'area_id')) {
                $table->string('area_id')->nullable()->after('kode_pos');
            }
            if (!Schema::hasColumn('alamat_user', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('area_id');
            }
            if (!Schema::hasColumn('alamat_user', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }
        });
    }

    public function down(): void
    {
        Schema::table('alamat_user', function (Blueprint $table) {
            if (Schema::hasColumn('alamat_user', 'longitude')) {
                $table->dropColumn('longitude');
            }
            if (Schema::hasColumn('alamat_user', 'latitude')) {
                $table->dropColumn('latitude');
            }
            if (Schema::hasColumn('alamat_user', 'area_id')) {
                $table->dropColumn('area_id');
            }
        });
    }
};
