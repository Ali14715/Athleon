<?php

namespace Database\Seeders;

use App\Models\Kategori;
use Illuminate\Database\Seeder;

class KategoriSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kategoris = [
            [
                'nama' => 'Sepatu Olahraga',
                'deskripsi' => 'Koleksi sepatu olahraga untuk berbagai aktivitas',
                'gambar' => 'placeholder.png',
            ],
            [
                'nama' => 'Pakaian Olahraga',
                'deskripsi' => 'Pakaian olahraga nyaman dan berkualitas',
                'gambar' => 'placeholder.png',
            ],
            [
                'nama' => 'Aksesoris',
                'deskripsi' => 'Aksesoris pelengkap aktivitas olahraga',
                'gambar' => 'placeholder.png',
            ],
            [
                'nama' => 'Tas Olahraga',
                'deskripsi' => 'Tas untuk membawa perlengkapan olahraga',
                'gambar' => 'placeholder.png',
            ],
            [
                'nama' => 'Alat Fitness',
                'deskripsi' => 'Peralatan untuk latihan dan fitness',
                'gambar' => 'placeholder.png',
            ],
        ];

        foreach ($kategoris as $kategori) {
            Kategori::create($kategori);
        }
    }
}
