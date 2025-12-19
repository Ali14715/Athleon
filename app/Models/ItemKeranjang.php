<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemKeranjang extends Model
{
    protected $table = 'item_keranjang';
    protected $fillable = [
        'keranjang_id',
        'produk_id',
        'varian_id',
        'varian_ids',
        'varian_label',
        'harga_varian',
        'jumlah',
        'subtotal',
    ];

    protected $casts = [
        'varian_ids' => 'array',
    ];

    public function keranjang()
    {
        return $this->belongsTo(Keranjang::class, 'keranjang_id');
    }

    public function produk()
    {
        return $this->belongsTo(Produk::class, 'produk_id');
    }

    public function varian()
    {
        return $this->belongsTo(ProdukVarian::class, 'varian_id');
    }

    /**
     * Load multiple variants for this cart item
     * This is a helper method, not a relationship
     */
    public function loadVariants()
    {
        if (empty($this->varian_ids) || !is_array($this->varian_ids)) {
            return collect([]);
        }
        
        return ProdukVarian::whereIn('id', $this->varian_ids)->get();
    }
}
