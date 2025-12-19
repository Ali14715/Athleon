<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('alamat_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('label')->default('Rumah'); // Rumah, Kantor, Lainnya
            $table->string('nama_penerima');
            $table->string('telepon_penerima');
            $table->text('alamat_lengkap');
            $table->string('kota');
            $table->string('provinsi');
            $table->string('kode_pos');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('alamat_user');
    }
};
