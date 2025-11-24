<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_pesanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan')->onDelete('cascade');
            $table->foreignId('produk_id')->constrained('produk')->onDelete('cascade');
            $table->foreignId('varian_id')->nullable()->constrained('produk_varian')->onDelete('set null');
            $table->string('varian_label')->nullable();
            $table->double('harga_varian')->default(0);
            $table->integer('jumlah');
            $table->decimal('harga_satuan', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_pesanan');
    }
};
