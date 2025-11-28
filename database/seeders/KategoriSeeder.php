<?php

namespace Database\Seeders;

use App\Models\Kategori;
use Illuminate\Database\Seeder;

class KategoriSeeder extends Seeder
{
    private const PLACEHOLDER_URL = 'https://res.cloudinary.com/dalw9amtm/image/upload/v1764316558/placeholders/yjpplgmugckjo7tqah5u.png';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $placeholder = self::PLACEHOLDER_URL;

        $kategoris = [
            [
                'nama' => 'Sepatu Olahraga',
                'deskripsi' => 'Koleksi sepatu olahraga untuk berbagai aktivitas',
                'gambar' => $placeholder,
            ],
            [
                'nama' => 'Pakaian Olahraga',
                'deskripsi' => 'Pakaian olahraga nyaman dan berkualitas',
                'gambar' => $placeholder,
            ],
            [
                'nama' => 'Aksesoris',
                'deskripsi' => 'Aksesoris pelengkap aktivitas olahraga',
                'gambar' => $placeholder,
            ],
            [
                'nama' => 'Tas Olahraga',
                'deskripsi' => 'Tas untuk membawa perlengkapan olahraga',
                'gambar' => $placeholder,
            ],
            [
                'nama' => 'Alat Fitness',
                'deskripsi' => 'Peralatan untuk latihan dan fitness',
                'gambar' => $placeholder,
            ],
        ];

        foreach ($kategoris as $kategori) {
            Kategori::create($kategori);
        }
    }
}
