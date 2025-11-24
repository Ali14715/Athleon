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
            $table->foreignId('idKategori')->constrained('kategori')->onDelete('cascade');
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->string('kategori')->nullable();
            $table->enum('jenisKelamin', ['L', 'P', 'U'])->default('U');
            $table->decimal('harga', 10, 2);
            $table->integer('stok')->default(0);
            $table->string('ukuran')->nullable();
            $table->string('gambar')->nullable();
            $table->json('galeri')->nullable();
            $table->json('varian')->nullable();
            $table->json('panduan_ukuran')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produk');
    }
};
