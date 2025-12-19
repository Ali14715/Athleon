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
                'gambar' => 'https://res.cloudinary.com/dalw9amtm/image/upload/v1765345530/athleon/categories/zpbpvl0joqbc1xpupi7y.jpg',
            ],
            [
                'nama' => 'Pakaian Olahraga',
                'deskripsi' => 'Pakaian olahraga nyaman dan berkualitas',
                'gambar' => 'https://res.cloudinary.com/dalw9amtm/image/upload/v1765345542/athleon/categories/tclqrribk2a4af0kbnvi.jpg',
            ],
            [
                'nama' => 'Aksesoris',
                'deskripsi' => 'Aksesoris pelengkap aktivitas olahraga',
                'gambar' => 'https://res.cloudinary.com/dalw9amtm/image/upload/v1765345557/athleon/categories/psty1fpzv5za5dosg0bj.jpg',
            ],
            [
                'nama' => 'Tas Olahraga',
                'deskripsi' => 'Tas untuk membawa perlengkapan olahraga',
                'gambar' => 'https://res.cloudinary.com/dalw9amtm/image/upload/v1765345568/athleon/categories/dtlxebhw428fhdd1l9w2.png',
            ],
            [
                'nama' => 'Alat Fitness',
                'deskripsi' => 'Peralatan untuk latihan dan fitness',
                'gambar' => 'https://res.cloudinary.com/dalw9amtm/image/upload/v1765345581/athleon/categories/h2hwoxawodxq3ka8fyxb.jpg',
            ],
        ];

        foreach ($kategoris as $kategori) {
            Kategori::create($kategori);
        }
    }
}
