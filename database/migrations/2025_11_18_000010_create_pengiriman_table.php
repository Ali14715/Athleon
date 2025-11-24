<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengiriman', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pesanan_id')->constrained('pesanan')->onDelete('cascade');
            $table->string('kurir');
            $table->string('nomor_resi')->nullable();
            $table->enum('status', ['pending', 'shipped', 'delivered'])->default('pending');
            $table->timestamp('tanggal_kirim')->nullable();
            $table->timestamp('tanggal_terima')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengiriman');
    }
};
