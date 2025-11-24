<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('alamat_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('label')->nullable();
            $table->string('nama_penerima');
            $table->string('telepon_penerima');
            $table->text('alamat_lengkap');
            $table->string('provinsi');
            $table->string('kota');
            $table->string('kecamatan');
            $table->string('kelurahan')->nullable();
            $table->string('kode_pos')->nullable();
            $table->string('area_id')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alamat_user');
    }
};
