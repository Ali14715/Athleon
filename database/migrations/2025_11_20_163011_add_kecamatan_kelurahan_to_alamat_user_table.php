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
        Schema::table('alamat_user', function (Blueprint $table) {
            // Check if columns don't exist before adding
            if (!Schema::hasColumn('alamat_user', 'kecamatan')) {
                $table->string('kecamatan')->nullable()->after('kota');
            }
            if (!Schema::hasColumn('alamat_user', 'kelurahan')) {
                $table->string('kelurahan')->nullable()->after('kecamatan');
            }
            // Make kode_pos nullable if not already
            $table->string('kode_pos')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('alamat_user', function (Blueprint $table) {
            $table->dropColumn(['kecamatan', 'kelurahan']);
        });
    }
};
