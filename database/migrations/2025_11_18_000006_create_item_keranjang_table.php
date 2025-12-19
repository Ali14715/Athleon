<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('item_keranjang', function (Blueprint $table) {
            $table->id();
            $table->foreignId('keranjang_id')->constrained('keranjang')->onDelete('cascade');
            $table->foreignId('produk_id')->constrained('produk')->onDelete('cascade');
            $table->foreignId('varian_id')->nullable()->constrained('produk_varian')->onDelete('set null');
            $table->json('varian_ids')->nullable();
            $table->string('varian_label')->nullable();
            $table->double('harga_varian')->default(0);
            $table->integer('jumlah')->default(1);
            $table->decimal('subtotal', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_keranjang');
    }
};
