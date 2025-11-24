<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pesanan extends Model
{
    use HasFactory;

    protected $table = 'pesanan';

    protected $fillable = [
        'user_id',
        'tanggal_pesanan',
        'total_harga',
        'ongkir',
        'status',
        'rating',
        'rating_feedback',
        'alamat_pengiriman',
        'metode_pembayaran',
        'metode_pengiriman',
        'kurir_code',
        'kurir_service',
        'tracking_number',
        'nama_penerima',
        'nomor_telepon',
    ];

    protected $casts = [
        'tanggal_pesanan' => 'datetime',
        'total_harga' => 'double',
        'ongkir' => 'double',
        'rating' => 'integer',
    ];

    // Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relasi ke Item Pesanan
    public function items()
    {
        return $this->hasMany(ItemPesanan::class);
    }

    // Relasi ke Pembayaran
    public function pembayaran()
    {
        return $this->hasOne(Pembayaran::class);
    }

    // Relasi ke Pengiriman
    public function pengiriman()
    {
        return $this->hasOne(Pengiriman::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
