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
        Schema::table('pembayaran', function (Blueprint $table) {
            if (!Schema::hasColumn('pembayaran', 'snap_token')) {
                $table->string('snap_token')->nullable()->after('status');
            }
            if (!Schema::hasColumn('pembayaran', 'transaction_id')) {
                $table->string('transaction_id')->nullable()->after('snap_token');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pembayaran', function (Blueprint $table) {
            $table->dropColumn(['snap_token', 'transaction_id']);
        });
    }
};
