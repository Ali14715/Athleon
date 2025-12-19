<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('produk', function (Blueprint $table) {
            $table->json('galeri')->nullable()->after('gambar');
            $table->json('varian')->nullable()->after('galeri');
            $table->json('panduan_ukuran')->nullable()->after('varian');
        });
    }

    public function down(): void
    {
        Schema::table('produk', function (Blueprint $table) {
            $table->dropColumn(['galeri', 'varian', 'panduan_ukuran']);
        });
    }
};
