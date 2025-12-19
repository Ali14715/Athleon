<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_keranjang', function (Blueprint $table) {
            if (!Schema::hasColumn('item_keranjang', 'varian_id')) {
                $table->unsignedBigInteger('varian_id')->nullable()->after('produk_id');
                $table->foreign('varian_id')->references('id')->on('produk_varian')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('item_keranjang', function (Blueprint $table) {
            if (Schema::hasColumn('item_keranjang', 'varian_id')) {
                $table->dropForeign(['varian_id']);
                $table->dropColumn('varian_id');
            }
        });
    }
};
