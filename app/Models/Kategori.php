<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Kategori extends Model
{
    protected $table = 'kategori';

    protected $fillable = [
        'nama',
        'deskripsi',
        'gambar',
    ];

    protected $appends = ['gambar_url'];

    /**
     * Relationship: Kategori has many Produk
     */
    public function produk()
    {
        return $this->hasMany(Produk::class, 'idKategori');
    }

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
        
        // Convert to absolute URL: /storage/path
        return url('storage/' . ltrim($path, '/'));
    }
}
