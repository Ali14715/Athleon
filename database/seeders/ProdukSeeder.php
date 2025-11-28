<?php

namespace Database\Seeders;

use App\Models\Produk;
use Illuminate\Database\Seeder;

class ProdukSeeder extends Seeder
{
    private const PLACEHOLDER_URL = 'https://res.cloudinary.com/dalw9amtm/image/upload/v1764316558/placeholders/yjpplgmugckjo7tqah5u.png';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $placeholder = self::PLACEHOLDER_URL;

        $produkList = [
            // Sepatu Olahraga (Kategori 1)
            [
                'idKategori' => 1,
                'nama' => 'Sepatu Lari Nike Air Zoom',
                'deskripsi' => 'Sepatu lari ringan dengan bantalan udara untuk kenyamanan maksimal',
                'kategori' => 'Sepatu Olahraga',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 50,
                'ukuran' => '38,39,40,41,42,43,44',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],
            [
                'idKategori' => 1,
                'nama' => 'Sepatu Basket Adidas Pro',
                'deskripsi' => 'Sepatu basket profesional dengan grip maksimal',
                'kategori' => 'Sepatu Olahraga',
                'jenisKelamin' => 'L',
                'harga' => 1000.00,
                'stok' => 30,
                'ukuran' => '40,41,42,43,44,45',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],
            [
                'idKategori' => 1,
                'nama' => 'Sepatu Training Puma',
                'deskripsi' => 'Sepatu training serbaguna untuk berbagai latihan',
                'kategori' => 'Sepatu Olahraga',
                'jenisKelamin' => 'P',
                'harga' => 1000.00,
                'stok' => 40,
                'ukuran' => '36,37,38,39,40,41',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],

            // Pakaian Olahraga (Kategori 2)
            [
                'idKategori' => 2,
                'nama' => 'Jersey Lari Dri-Fit',
                'deskripsi' => 'Jersey lari dengan teknologi quick-dry',
                'kategori' => 'Pakaian Olahraga',
                'jenisKelamin' => 'L',
                'harga' => 1000.00,
                'stok' => 100,
                'ukuran' => 'S,M,L,XL,XXL',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],
            [
                'idKategori' => 2,
                'nama' => 'Sports Bra Premium',
                'deskripsi' => 'Sports bra dengan support tinggi untuk aktivitas intensif',
                'kategori' => 'Pakaian Olahraga',
                'jenisKelamin' => 'P',
                'harga' => 1000.00,
                'stok' => 80,
                'ukuran' => 'S,M,L,XL',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],
            [
                'idKategori' => 2,
                'nama' => 'Celana Training Jogger',
                'deskripsi' => 'Celana training nyaman dengan bahan elastis',
                'kategori' => 'Pakaian Olahraga',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 60,
                'ukuran' => 'S,M,L,XL,XXL',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],
            [
                'idKategori' => 2,
                'nama' => 'Hoodie Olahraga',
                'deskripsi' => 'Hoodie hangat untuk pemanasan atau istirahat',
                'kategori' => 'Pakaian Olahraga',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 45,
                'ukuran' => 'M,L,XL,XXL',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],

            // Aksesoris (Kategori 3)
            [
                'idKategori' => 3,
                'nama' => 'Kaos Kaki Olahraga',
                'deskripsi' => 'Kaos kaki cushion untuk kenyamanan ekstra',
                'kategori' => 'Aksesoris',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 200,
                'ukuran' => 'Free Size',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder]),
            ],
            [
                'idKategori' => 3,
                'nama' => 'Topi Cap Sport',
                'deskripsi' => 'Topi olahraga dengan bahan breathable',
                'kategori' => 'Aksesoris',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 75,
                'ukuran' => 'Free Size',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],
            [
                'idKategori' => 3,
                'nama' => 'Sarung Tangan Gym',
                'deskripsi' => 'Sarung tangan untuk latihan beban',
                'kategori' => 'Aksesoris',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 90,
                'ukuran' => 'S,M,L,XL',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder]),
            ],

            // Tas Olahraga (Kategori 4)
            [
                'idKategori' => 4,
                'nama' => 'Tas Gym Duffle',
                'deskripsi' => 'Tas gym besar dengan banyak kompartemen',
                'kategori' => 'Tas Olahraga',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 35,
                'ukuran' => 'Large',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],
            [
                'idKategori' => 4,
                'nama' => 'Tas Ransel Sport',
                'deskripsi' => 'Ransel olahraga dengan laptop slot',
                'kategori' => 'Tas Olahraga',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 50,
                'ukuran' => 'Medium',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],

            // Alat Fitness (Kategori 5)
            [
                'idKategori' => 5,
                'nama' => 'Dumbell Set 5kg',
                'deskripsi' => 'Set dumbell 5kg untuk home workout',
                'kategori' => 'Alat Fitness',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 25,
                'ukuran' => '5kg',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder]),
            ],
            [
                'idKategori' => 5,
                'nama' => 'Matras Yoga',
                'deskripsi' => 'Matras yoga premium anti-slip',
                'kategori' => 'Alat Fitness',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 40,
                'ukuran' => '180x60cm',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder, $placeholder]),
            ],
            [
                'idKategori' => 5,
                'nama' => 'Resistance Band Set',
                'deskripsi' => 'Set resistance band 5 level',
                'kategori' => 'Alat Fitness',
                'jenisKelamin' => 'U',
                'harga' => 1000.00,
                'stok' => 60,
                'ukuran' => 'Set',
                'gambar' => $placeholder,
                'galeri' => json_encode([$placeholder]),
            ],
        ];

        foreach ($produkList as $produk) {
            Produk::create($produk);
        }
    }
}
