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
        Schema::create('item_keranjang', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->unsignedBigInteger('keranjang_id');
    $table->unsignedBigInteger('produk_id');
    $table->integer('jumlah');
    $table->double('subtotal');
    $table->timestamps();

    $table->foreign('keranjang_id')->references('id')->on('keranjang')->onDelete('cascade');
    $table->foreign('produk_id')->references('id')->on('produk')->onDelete('cascade');
});

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('item_keranjang');
    }
};
