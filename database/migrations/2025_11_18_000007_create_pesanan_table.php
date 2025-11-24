<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pesanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('tanggal_pesanan')->useCurrent();
            $table->decimal('total_harga', 10, 2);
            $table->decimal('ongkir', 10, 2)->default(0);
            $table->enum('status', ['Belum Dibayar', 'Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan'])->default('Belum Dibayar');
            $table->integer('rating')->nullable();
            $table->text('rating_feedback')->nullable();
            $table->text('alamat_pengiriman')->nullable();
            $table->string('metode_pembayaran')->nullable();
            $table->string('metode_pengiriman')->nullable();
            $table->string('kurir_code')->nullable();
            $table->string('kurir_service')->nullable();
            $table->string('tracking_number')->nullable();
            $table->string('nama_penerima')->nullable();
            $table->string('nomor_telepon')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pesanan');
    }
};
