<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produk_varian', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('produk_id');
            $table->string('nama_varian', 100); // e.g., "Size", "Color"
            $table->string('nilai_varian', 100); // e.g., "M", "L", "XL", "Black"
            $table->double('harga_tambahan')->default(0); // additional price
            $table->integer('stok')->default(0);
            $table->timestamps();

            $table->foreign('produk_id')->references('id')->on('produk')->onDelete('cascade');
            $table->unique(['produk_id', 'nama_varian', 'nilai_varian']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produk_varian');
    }
};
