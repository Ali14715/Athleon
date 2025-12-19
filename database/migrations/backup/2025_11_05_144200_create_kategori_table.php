<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kategori', function (Blueprint $table) {
            $table->id(); // kolom id: int (auto increment, primary key)
            $table->string('nama', 100); // nama kategori
            $table->text('deskripsi')->nullable(); // deskripsi kategori
            $table->timestamps(); // created_at & updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kategori');
    }
};