<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            if (!Schema::hasColumn('pesanan', 'ongkir')) {
                $table->double('ongkir')->default(0)->after('total_harga');
            }
            if (!Schema::hasColumn('pesanan', 'kurir_code')) {
                $table->string('kurir_code')->nullable()->after('metode_pengiriman');
            }
            if (!Schema::hasColumn('pesanan', 'kurir_service')) {
                $table->string('kurir_service')->nullable()->after('kurir_code');
            }
            if (!Schema::hasColumn('pesanan', 'tracking_number')) {
                $table->string('tracking_number')->nullable()->after('kurir_service');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pesanan', function (Blueprint $table) {
            if (Schema::hasColumn('pesanan', 'tracking_number')) {
                $table->dropColumn('tracking_number');
            }
            if (Schema::hasColumn('pesanan', 'kurir_service')) {
                $table->dropColumn('kurir_service');
            }
            if (Schema::hasColumn('pesanan', 'kurir_code')) {
                $table->dropColumn('kurir_code');
            }
            if (Schema::hasColumn('pesanan', 'ongkir')) {
                $table->dropColumn('ongkir');
            }
        });
    }
};
