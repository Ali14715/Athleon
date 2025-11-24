<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ItemPesanan extends Model
{
    use HasFactory;

    protected $table = 'item_pesanan';

    protected $fillable = [
        'pesanan_id',
        'produk_id',
        'varian_id',
        'varian_label',
        'harga_varian',
        'jumlah',
        'harga_satuan',
    ];

    protected $casts = [
        'harga_satuan' => 'double',
        'harga_varian' => 'double',
    ];

    protected $appends = ['subtotal', 'varians'];

    // Accessor untuk subtotal (dihitung otomatis)
    public function getSubtotalAttribute()
    {
        $hargaDasar = $this->harga_varian > 0 ? $this->harga_varian : $this->harga_satuan;
        return $this->jumlah * $hargaDasar;
    }

    // Accessor untuk varians array dari varian_label
    public function getVariansAttribute()
    {
        if (!$this->varian_label) {
            return [];
        }

        // Parse "Ukuran: 42, Warna: Hitam" menjadi array
        $variants = [];
        $parts = explode(', ', $this->varian_label);
        
        foreach ($parts as $part) {
            if (strpos($part, ':') !== false) {
                list($jenis, $nilai) = explode(':', $part, 2);
                $variants[] = [
                    'jenis' => trim($jenis),
                    'nilai' => trim($nilai)
                ];
            }
        }
        
        return $variants;
    }

    // Relasi ke Pesanan
    public function pesanan()
    {
        return $this->belongsTo(Pesanan::class);
    }

    // Relasi ke Produk
    public function produk()
    {
        return $this->belongsTo(Produk::class);
    }

    // Relasi ke Varian
    public function varian()
    {
        return $this->belongsTo(ProdukVarian::class, 'varian_id');
    }
}
