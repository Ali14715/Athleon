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
        Schema::table('item_keranjang', function (Blueprint $table) {
            // Add JSON column to store multiple variant IDs (e.g., [12, 15] for Size XL + Warna Merah)
            $table->json('varian_ids')->nullable()->after('varian_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('item_keranjang', function (Blueprint $table) {
            $table->dropColumn('varian_ids');
        });
    }
};
