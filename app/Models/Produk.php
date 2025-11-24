<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Produk extends Model
{
    protected $table = 'produk';

    protected $fillable = [
        'idKategori',
        'nama',
        'deskripsi',
        'kategori',
        'jenisKelamin',
        'harga',
        'stok',
        'ukuran',
        'gambar',
        'galeri',
        'varian',
        'panduan_ukuran',
    ];

    protected $casts = [
        'harga' => 'decimal:2',
        'stok' => 'integer',
        'galeri' => 'array',
        'varian' => 'array',
        'panduan_ukuran' => 'array',
    ];

    protected $appends = ['gambar_url', 'galeri_urls', 'average_rating', 'rating_count'];

    protected $hidden = ['varian']; // Hide JSON field, use varians relation instead

    /**
     * Get the absolute URL for the main image
     */
    public function getGambarUrlAttribute(): ?string
    {
        if (!$this->gambar) {
            return null;
        }

        if (str_starts_with($this->gambar, 'http')) {
            return $this->gambar;
        }

        // Remove storage/ prefix if exists (from seeder data)
        $path = $this->gambar;
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8); // Remove 'storage/'
        }
        
        // If path doesn't start with produk/, add it
        if (!str_starts_with($path, 'produk/') && !str_starts_with($path, 'placeholder')) {
            $path = 'produk/' . ltrim($path, '/');
        }
        
        // Convert to absolute URL: /storage/path
        return url('storage/' . ltrim($path, '/'));
    }

    /**
     * Get absolute URLs for gallery images
     */
    public function getGaleriUrlsAttribute(): array
    {
        $galeri = $this->galeri;
        
        if (empty($galeri) || !is_array($galeri)) {
            return [];
        }

        return array_map(function ($image) {
            if (str_starts_with($image, 'http')) {
                return $image;
            }
            
            // Remove storage/ prefix if exists (from seeder data)
            $path = $image;
            if (str_starts_with($path, 'storage/')) {
                $path = substr($path, 8); // Remove 'storage/'
            }
            
            // If path doesn't start with produk/, add it
            if (!str_starts_with($path, 'produk/') && !str_starts_with($path, 'placeholder')) {
                $path = 'produk/' . ltrim($path, '/');
            }
            
            // Convert to absolute URL: /storage/path
            return url('storage/' . ltrim($path, '/'));
        }, $galeri);
    }

    /**
     * Relationship: Produk belongs to Kategori
     */
    public function kategori()
    {
        return $this->belongsTo(Kategori::class, 'idKategori');
    }

    /**
     * Relationship: Produk wishlisted by many users
     */
    public function wishlists()
    {
        return $this->hasMany(Wishlist::class);
    }

    /**
     * Relationship: Produk has many variants
     */
    public function varians()
    {
        return $this->hasMany(ProdukVarian::class, 'produk_id');
    }

    /**
     * Relationship: Produk has many pesanan items
     */
    public function itemPesanan()
    {
        return $this->hasMany(ItemPesanan::class, 'produk_id');
    }

    /**
     * Get average rating from completed orders
     */
    public function getAverageRatingAttribute(): float
    {
        $ratings = Pesanan::whereHas('items', function ($query) {
            $query->where('produk_id', $this->id);
        })
        ->where('status', 'Selesai')
        ->whereNotNull('rating')
        ->pluck('rating');

        if ($ratings->isEmpty()) {
            return 0;
        }

        return round($ratings->avg(), 1);
    }

    /**
     * Get total rating count from completed orders
     */
    public function getRatingCountAttribute(): int
    {
        return Pesanan::whereHas('items', function ($query) {
            $query->where('produk_id', $this->id);
        })
        ->where('status', 'Selesai')
        ->whereNotNull('rating')
        ->count();
    }
}
