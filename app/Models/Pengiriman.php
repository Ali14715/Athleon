<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pengiriman extends Model
{
    use HasFactory;

    protected $table = 'pengiriman';

    protected $fillable = [
        'pesanan_id',
        'nomor_resi',
        'status',
        'provider',
    ];

    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }
}
