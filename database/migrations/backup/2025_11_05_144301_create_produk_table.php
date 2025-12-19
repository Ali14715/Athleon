<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produk', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idKategori');
            $table->string('nama', 100);
            $table->text('deskripsi')->nullable();
            $table->string('kategori', 50)->nullable();
            $table->string('jenisKelamin', 20)->nullable();
            $table->double('harga');
            $table->integer('stok')->default(0);
            $table->string('ukuran', 20)->nullable();
            $table->string('gambar', 255)->nullable();
            $table->timestamps();

            // Foreign key ke tabel kategori
            
            $table->foreign('idKategori')->references('id')->on('kategori')->onDelete('cascade');

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produk');
    }
};