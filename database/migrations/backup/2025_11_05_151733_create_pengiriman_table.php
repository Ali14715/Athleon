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
    Schema::create('pengiriman', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('pesanan_id');
        $table->string('nomor_resi');
        $table->string('status');
        $table->string('provider');
        $table->timestamps();

        $table->foreign('pesanan_id')->references('id')->on('pesanan')->onDelete('cascade');
    });
}

};
