<?php

namespace Database\Seeders;

use App\Models\Banner;
use Illuminate\Database\Seeder;

class BannerSeeder extends Seeder
{
    private const PLACEHOLDER_URL = 'https://res.cloudinary.com/dalw9amtm/image/upload/v1764316558/placeholders/yjpplgmugckjo7tqah5u.png';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $placeholder = self::PLACEHOLDER_URL;

        $banners = [
            [
                'title' => 'Koleksi Sepatu Terbaru',
                'description' => 'Dapatkan sepatu olahraga terbaru dengan diskon hingga 50%',
                'image_url' => 'https://res.cloudinary.com/dalw9amtm/image/upload/v1765345696/athleon/banners/xrf4xmlbpcefst5vv1dw.jpg',
                'link_url' => 'http://127.0.0.1:8000/catalog',
                'button_text' => 'Belanja Sekarang',
                'is_active' => true,
                'order' => 1,
            ],
            [
                'title' => 'Pakaian Olahraga Premium',
                'description' => 'Koleksi pakaian olahraga berkualitas tinggi',
                'image_url' => 'https://res.cloudinary.com/dalw9amtm/image/upload/v1765345721/athleon/banners/z4tdbmv3jzy5lk65qqpu.jpg',
                'link_url' => 'http://127.0.0.1:8000/catalog',
                'button_text' => 'Lihat Koleksi',
                'is_active' => true,
                'order' => 2,
            ],
            [
                'title' => 'Perlengkapan Fitness',
                'description' => 'Lengkapi home gym Anda dengan alat fitness terbaik',
                'image_url' => 'https://res.cloudinary.com/dalw9amtm/image/upload/v1765345792/athleon/banners/mcrefr3ihozwssog0sgg.jpg',
                'link_url' => 'http://127.0.0.1:8000/catalog',
                'button_text' => 'Explore',
                'is_active' => true,
                'order' => 3,
            ],
        ];

        foreach ($banners as $banner) {
            Banner::create($banner);
        }
    }
}
