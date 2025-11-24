<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_keranjang', function (Blueprint $table) {
            $table->string('varian_label', 50)->nullable()->after('produk_id');
            $table->double('harga_varian')->default(0)->after('varian_label');
        });

        Schema::table('item_pesanan', function (Blueprint $table) {
            $table->string('varian_label', 50)->nullable()->after('produk_id');
            $table->double('harga_varian')->default(0)->after('varian_label');
        });
    }

    public function down(): void
    {
        Schema::table('item_keranjang', function (Blueprint $table) {
            $table->dropColumn(['varian_label', 'harga_varian']);
        });

        Schema::table('item_pesanan', function (Blueprint $table) {
            $table->dropColumn(['varian_label', 'harga_varian']);
        });
    }
};
