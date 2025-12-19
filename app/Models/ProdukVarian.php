<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProdukVarian extends Model
{
    use HasFactory;

    protected $table = 'produk_varian';

    protected $fillable = [
        'produk_id',
        'nama_varian',
        'nilai_varian',
        'harga_tambahan',
        'stok',
    ];

    protected $casts = [
        'harga_tambahan' => 'double',
        'stok' => 'integer',
    ];

    public function produk()
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }
}
