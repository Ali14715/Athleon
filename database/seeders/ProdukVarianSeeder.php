<?php

namespace Database\Seeders;

use App\Models\ProdukVarian;
use Illuminate\Database\Seeder;

class ProdukVarianSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $varians = [
            // Varian untuk Sepatu Nike (produk_id 1)
            ['produk_id' => 1, 'nama_varian' => 'Ukuran', 'nilai_varian' => '38', 'harga_tambahan' => 0, 'stok' => 10],
            ['produk_id' => 1, 'nama_varian' => 'Ukuran', 'nilai_varian' => '39', 'harga_tambahan' => 0, 'stok' => 10],
            ['produk_id' => 1, 'nama_varian' => 'Ukuran', 'nilai_varian' => '40', 'harga_tambahan' => 0, 'stok' => 10],
            ['produk_id' => 1, 'nama_varian' => 'Ukuran', 'nilai_varian' => '41', 'harga_tambahan' => 0, 'stok' => 10],
            ['produk_id' => 1, 'nama_varian' => 'Ukuran', 'nilai_varian' => '42', 'harga_tambahan' => 0, 'stok' => 5],
            ['produk_id' => 1, 'nama_varian' => 'Ukuran', 'nilai_varian' => '43', 'harga_tambahan' => 0, 'stok' => 5],

            // Varian untuk Sepatu Adidas (produk_id 2)
            ['produk_id' => 2, 'nama_varian' => 'Ukuran', 'nilai_varian' => '40', 'harga_tambahan' => 0, 'stok' => 10],
            ['produk_id' => 2, 'nama_varian' => 'Ukuran', 'nilai_varian' => '41', 'harga_tambahan' => 0, 'stok' => 10],
            ['produk_id' => 2, 'nama_varian' => 'Ukuran', 'nilai_varian' => '42', 'harga_tambahan' => 0, 'stok' => 5],
            ['produk_id' => 2, 'nama_varian' => 'Ukuran', 'nilai_varian' => '43', 'harga_tambahan' => 0, 'stok' => 5],

            // Varian untuk Jersey Lari (produk_id 4)
            ['produk_id' => 4, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'S', 'harga_tambahan' => 0, 'stok' => 20],
            ['produk_id' => 4, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'M', 'harga_tambahan' => 0, 'stok' => 30],
            ['produk_id' => 4, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'L', 'harga_tambahan' => 0, 'stok' => 30],
            ['produk_id' => 4, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'XL', 'harga_tambahan' => 0, 'stok' => 15],
            ['produk_id' => 4, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'XXL', 'harga_tambahan' => 0, 'stok' => 5],

            // Varian warna untuk Jersey Lari
            ['produk_id' => 4, 'nama_varian' => 'Warna', 'nilai_varian' => 'Hitam', 'harga_tambahan' => 0, 'stok' => 50],
            ['produk_id' => 4, 'nama_varian' => 'Warna', 'nilai_varian' => 'Putih', 'harga_tambahan' => 0, 'stok' => 30],
            ['produk_id' => 4, 'nama_varian' => 'Warna', 'nilai_varian' => 'Merah', 'harga_tambahan' => 0, 'stok' => 20],

            // Varian untuk Celana Jogger (produk_id 6)
            ['produk_id' => 6, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'S', 'harga_tambahan' => 0, 'stok' => 10],
            ['produk_id' => 6, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'M', 'harga_tambahan' => 0, 'stok' => 20],
            ['produk_id' => 6, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'L', 'harga_tambahan' => 0, 'stok' => 20],
            ['produk_id' => 6, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'XL', 'harga_tambahan' => 0, 'stok' => 10],

            // Varian untuk Hoodie (produk_id 7)
            ['produk_id' => 7, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'M', 'harga_tambahan' => 0, 'stok' => 15],
            ['produk_id' => 7, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'L', 'harga_tambahan' => 0, 'stok' => 15],
            ['produk_id' => 7, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'XL', 'harga_tambahan' => 0, 'stok' => 10],
            ['produk_id' => 7, 'nama_varian' => 'Ukuran', 'nilai_varian' => 'XXL', 'harga_tambahan' => 0, 'stok' => 5],
        ];

        foreach ($varians as $varian) {
            ProdukVarian::create($varian);
        }
    }
}
