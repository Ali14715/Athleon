<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('pesanan', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('user_id');
        $table->dateTime('tanggal_pesanan');
        $table->double('total_harga');
        $table->enum('status', ['Belum Dibayar', 'Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan']);
        $table->string('alamat_pengiriman');
        $table->string('metode_pembayaran');
        $table->string('metode_pengiriman');
        $table->timestamps();

        $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
    });
}

};
