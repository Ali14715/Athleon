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
    Schema::create('pembayaran', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('pesanan_id')->nullable();
        $table->double('jumlah_bayar');
        $table->date('tanggal_bayar');
        $table->string('metode');
        $table->string('status');
        $table->timestamps();

        $table->foreign('pesanan_id')->references('id')->on('pesanan')->onDelete('set null');
    });
}

};
