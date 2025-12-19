-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 22, 2025 at 03:11 AM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `athleon_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `alamat_user`
--

CREATE TABLE `alamat_user` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `label` varchar(255) DEFAULT NULL,
  `nama_penerima` varchar(255) NOT NULL,
  `telepon_penerima` varchar(255) NOT NULL,
  `alamat_lengkap` text NOT NULL,
  `provinsi` varchar(255) NOT NULL,
  `kota` varchar(255) NOT NULL,
  `kecamatan` varchar(255) NOT NULL,
  `kelurahan` varchar(255) DEFAULT NULL,
  `kode_pos` varchar(255) DEFAULT NULL,
  `area_id` varchar(255) DEFAULT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `banners`
--

CREATE TABLE `banners` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `link_url` varchar(255) DEFAULT NULL,
  `button_text` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `banners`
--

INSERT INTO `banners` (`id`, `title`, `description`, `image_url`, `link_url`, `button_text`, `is_active`, `order`, `created_at`, `updated_at`) VALUES
(1, 'Koleksi Sepatu Terbaru', 'Dapatkan sepatu olahraga terbaru dengan diskon hingga 50%', 'placeholder.png', 'http://127.0.0.1:8000/catalog', 'Belanja Sekarang', 1, 1, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(2, 'Pakaian Olahraga Premium', 'Koleksi pakaian olahraga berkualitas tinggi', 'placeholder.png', 'http://127.0.0.1:8000/catalog', 'Lihat Koleksi', 1, 2, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(3, 'Perlengkapan Fitness', 'Lengkapi home gym Anda dengan alat fitness terbaik', 'placeholder.png', 'http://127.0.0.1:8000/catalog', 'Explore', 1, 3, '2025-11-21 09:18:16', '2025-11-21 09:18:16');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_keranjang`
--

CREATE TABLE `item_keranjang` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `keranjang_id` bigint(20) UNSIGNED NOT NULL,
  `produk_id` bigint(20) UNSIGNED NOT NULL,
  `varian_id` bigint(20) UNSIGNED DEFAULT NULL,
  `varian_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`varian_ids`)),
  `varian_label` varchar(255) DEFAULT NULL,
  `harga_varian` double NOT NULL DEFAULT 0,
  `jumlah` int(11) NOT NULL DEFAULT 1,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item_pesanan`
--

CREATE TABLE `item_pesanan` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pesanan_id` bigint(20) UNSIGNED NOT NULL,
  `produk_id` bigint(20) UNSIGNED NOT NULL,
  `varian_id` bigint(20) UNSIGNED DEFAULT NULL,
  `varian_label` varchar(255) DEFAULT NULL,
  `harga_varian` double NOT NULL DEFAULT 0,
  `jumlah` int(11) NOT NULL,
  `harga_satuan` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE `kategori` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kategori`
--

INSERT INTO `kategori` (`id`, `nama`, `deskripsi`, `gambar`, `created_at`, `updated_at`) VALUES
(1, 'Sepatu Olahraga', 'Koleksi sepatu olahraga untuk berbagai aktivitas', 'placeholder.png', '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(2, 'Pakaian Olahraga', 'Pakaian olahraga nyaman dan berkualitas', 'placeholder.png', '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(3, 'Aksesoris', 'Aksesoris pelengkap aktivitas olahraga', 'placeholder.png', '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(4, 'Tas Olahraga', 'Tas untuk membawa perlengkapan olahraga', 'placeholder.png', '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(5, 'Alat Fitness', 'Peralatan untuk latihan dan fitness', 'placeholder.png', '2025-11-21 09:18:16', '2025-11-21 09:18:16');

-- --------------------------------------------------------

--
-- Table structure for table `keranjang`
--

CREATE TABLE `keranjang` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `total_harga` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_11_18_000001_create_alamat_user_table', 1),
(5, '2025_11_18_000002_create_kategori_table', 1),
(6, '2025_11_18_000003_create_produk_table', 1),
(7, '2025_11_18_000004_create_produk_varian_table', 1),
(8, '2025_11_18_000005_create_keranjang_table', 1),
(9, '2025_11_18_000006_create_item_keranjang_table', 1),
(10, '2025_11_18_000007_create_pesanan_table', 1),
(11, '2025_11_18_000008_create_item_pesanan_table', 1),
(12, '2025_11_18_000009_create_pembayaran_table', 1),
(13, '2025_11_18_000010_create_pengiriman_table', 1),
(14, '2025_11_18_000011_create_notifications_table', 1),
(15, '2025_11_18_000012_create_wishlists_table', 1),
(16, '2025_11_18_000013_create_banners_table', 1),
(17, '2025_11_20_163011_add_kecamatan_kelurahan_to_alamat_user_table', 1),
(18, '2025_11_21_000001_create_password_reset_otps_table', 1);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `pesanan_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pembayaran_id` bigint(20) UNSIGNED DEFAULT NULL,
  `type` varchar(255) NOT NULL DEFAULT 'general',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `target_role` varchar(255) NOT NULL DEFAULT 'customer',
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_otps`
--

CREATE TABLE `password_reset_otps` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `email` varchar(255) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pesanan_id` bigint(20) UNSIGNED NOT NULL,
  `jumlah_bayar` decimal(10,2) NOT NULL,
  `tanggal_bayar` date DEFAULT NULL,
  `metode` varchar(255) NOT NULL,
  `snap_token` varchar(255) DEFAULT NULL,
  `transaction_id` varchar(255) DEFAULT NULL,
  `status` enum('pending','paid','failed','expired') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengiriman`
--

CREATE TABLE `pengiriman` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `pesanan_id` bigint(20) UNSIGNED NOT NULL,
  `kurir` varchar(255) NOT NULL,
  `nomor_resi` varchar(255) DEFAULT NULL,
  `status` enum('pending','shipped','delivered') NOT NULL DEFAULT 'pending',
  `tanggal_kirim` timestamp NULL DEFAULT NULL,
  `tanggal_terima` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pesanan`
--

CREATE TABLE `pesanan` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `tanggal_pesanan` timestamp NOT NULL DEFAULT current_timestamp(),
  `total_harga` decimal(10,2) NOT NULL,
  `ongkir` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('Belum Dibayar','Dikemas','Dikirim','Selesai','Dibatalkan') NOT NULL DEFAULT 'Belum Dibayar',
  `rating` int(11) DEFAULT NULL,
  `rating_feedback` text DEFAULT NULL,
  `alamat_pengiriman` text DEFAULT NULL,
  `metode_pembayaran` varchar(255) DEFAULT NULL,
  `metode_pengiriman` varchar(255) DEFAULT NULL,
  `kurir_code` varchar(255) DEFAULT NULL,
  `kurir_service` varchar(255) DEFAULT NULL,
  `tracking_number` varchar(255) DEFAULT NULL,
  `nama_penerima` varchar(255) DEFAULT NULL,
  `nomor_telepon` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produk`
--

CREATE TABLE `produk` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `idKategori` bigint(20) UNSIGNED NOT NULL,
  `nama` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `kategori` varchar(255) DEFAULT NULL,
  `jenisKelamin` enum('L','P','U') NOT NULL DEFAULT 'U',
  `harga` decimal(10,2) NOT NULL,
  `stok` int(11) NOT NULL DEFAULT 0,
  `ukuran` varchar(255) DEFAULT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  `galeri` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`galeri`)),
  `varian` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`varian`)),
  `panduan_ukuran` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`panduan_ukuran`)),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produk`
--

INSERT INTO `produk` (`id`, `idKategori`, `nama`, `deskripsi`, `kategori`, `jenisKelamin`, `harga`, `stok`, `ukuran`, `gambar`, `galeri`, `varian`, `panduan_ukuran`, `created_at`, `updated_at`) VALUES
(1, 1, 'Sepatu Lari Nike Air Zoom', 'Sepatu lari ringan dengan bantalan udara untuk kenyamanan maksimal', 'Sepatu Olahraga', 'U', '1000.00', 50, '38,39,40,41,42,43,44', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(2, 1, 'Sepatu Basket Adidas Pro', 'Sepatu basket profesional dengan grip maksimal', 'Sepatu Olahraga', 'L', '1000.00', 30, '40,41,42,43,44,45', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(3, 1, 'Sepatu Training Puma', 'Sepatu training serbaguna untuk berbagai latihan', 'Sepatu Olahraga', 'P', '1000.00', 40, '36,37,38,39,40,41', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(4, 2, 'Jersey Lari Dri-Fit', 'Jersey lari dengan teknologi quick-dry', 'Pakaian Olahraga', 'L', '1000.00', 100, 'S,M,L,XL,XXL', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(5, 2, 'Sports Bra Premium', 'Sports bra dengan support tinggi untuk aktivitas intensif', 'Pakaian Olahraga', 'P', '1000.00', 80, 'S,M,L,XL', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(6, 2, 'Celana Training Jogger', 'Celana training nyaman dengan bahan elastis', 'Pakaian Olahraga', 'U', '1000.00', 60, 'S,M,L,XL,XXL', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(7, 2, 'Hoodie Olahraga', 'Hoodie hangat untuk pemanasan atau istirahat', 'Pakaian Olahraga', 'U', '1000.00', 45, 'M,L,XL,XXL', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(8, 3, 'Kaos Kaki Olahraga', 'Kaos kaki cushion untuk kenyamanan ekstra', 'Aksesoris', 'U', '1000.00', 200, 'Free Size', 'placeholder.png', '\"[\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(9, 3, 'Topi Cap Sport', 'Topi olahraga dengan bahan breathable', 'Aksesoris', 'U', '1000.00', 75, 'Free Size', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(10, 3, 'Sarung Tangan Gym', 'Sarung tangan untuk latihan beban', 'Aksesoris', 'U', '1000.00', 90, 'S,M,L,XL', 'placeholder.png', '\"[\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(11, 4, 'Tas Gym Duffle', 'Tas gym besar dengan banyak kompartemen', 'Tas Olahraga', 'U', '1000.00', 35, 'Large', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(12, 4, 'Tas Ransel Sport', 'Ransel olahraga dengan laptop slot', 'Tas Olahraga', 'U', '1000.00', 50, 'Medium', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(13, 5, 'Dumbell Set 5kg', 'Set dumbell 5kg untuk home workout', 'Alat Fitness', 'U', '1000.00', 25, '5kg', 'placeholder.png', '\"[\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(14, 5, 'Matras Yoga', 'Matras yoga premium anti-slip', 'Alat Fitness', 'U', '1000.00', 40, '180x60cm', 'placeholder.png', '\"[\\\"placeholder.png\\\",\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(15, 5, 'Resistance Band Set', 'Set resistance band 5 level', 'Alat Fitness', 'U', '1000.00', 60, 'Set', 'placeholder.png', '\"[\\\"placeholder.png\\\"]\"', NULL, NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16');

-- --------------------------------------------------------

--
-- Table structure for table `produk_varian`
--

CREATE TABLE `produk_varian` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `produk_id` bigint(20) UNSIGNED NOT NULL,
  `nama_varian` varchar(255) NOT NULL,
  `nilai_varian` varchar(255) NOT NULL,
  `harga_tambahan` double NOT NULL DEFAULT 0,
  `stok` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produk_varian`
--

INSERT INTO `produk_varian` (`id`, `produk_id`, `nama_varian`, `nilai_varian`, `harga_tambahan`, `stok`, `created_at`, `updated_at`) VALUES
(1, 1, 'Ukuran', '38', 0, 10, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(2, 1, 'Ukuran', '39', 0, 10, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(3, 1, 'Ukuran', '40', 0, 10, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(4, 1, 'Ukuran', '41', 0, 10, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(5, 1, 'Ukuran', '42', 0, 5, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(6, 1, 'Ukuran', '43', 0, 5, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(7, 2, 'Ukuran', '40', 0, 10, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(8, 2, 'Ukuran', '41', 0, 10, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(9, 2, 'Ukuran', '42', 0, 5, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(10, 2, 'Ukuran', '43', 0, 5, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(11, 4, 'Ukuran', 'S', 0, 20, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(12, 4, 'Ukuran', 'M', 0, 30, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(13, 4, 'Ukuran', 'L', 0, 30, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(14, 4, 'Ukuran', 'XL', 0, 15, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(15, 4, 'Ukuran', 'XXL', 0, 5, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(16, 4, 'Warna', 'Hitam', 0, 50, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(17, 4, 'Warna', 'Putih', 0, 30, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(18, 4, 'Warna', 'Merah', 0, 20, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(19, 6, 'Ukuran', 'S', 0, 10, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(20, 6, 'Ukuran', 'M', 0, 20, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(21, 6, 'Ukuran', 'L', 0, 20, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(22, 6, 'Ukuran', 'XL', 0, 10, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(23, 7, 'Ukuran', 'M', 0, 15, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(24, 7, 'Ukuran', 'L', 0, 15, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(25, 7, 'Ukuran', 'XL', 0, 10, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(26, 7, 'Ukuran', 'XXL', 0, 5, '2025-11-21 09:18:16', '2025-11-21 09:18:16');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('HiNqLHYqU9JHgSOYOU66b7ebyVwTwoM9rmg748cV', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoidHJQSzhVR3JjQVZOcjA0cmI1SE5Yd0ZuYTFnWVR1dGV0T0l0d3M1NyI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1763741902);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','customer') NOT NULL DEFAULT 'customer',
  `telepon` varchar(255) DEFAULT NULL,
  `jenis_kelamin` enum('L','P') DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `telepon`, `jenis_kelamin`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin Athleon', 'admin@athleon.com', NULL, '$2y$12$KEvLYYDDgFMlRCOOClIvZOV5vdl2lBuihAj4S2RcBnbVrfexp1vf.', 'admin', '081234567890', 'L', NULL, '2025-11-21 09:18:15', '2025-11-21 09:18:15'),
(2, 'Budi Santoso', 'budi@example.com', NULL, '$2y$12$CtLJYyKflS7aB6ECW/cRIOO2ZmrTWEP9FVtlrMMjx34yfcRS2Agz2', 'customer', '081234567891', 'L', NULL, '2025-11-21 09:18:15', '2025-11-21 09:18:15'),
(3, 'Siti Nurhaliza', 'siti@example.com', NULL, '$2y$12$88x3n8bbAhBCPo.kXnXgqePr1RGNyP7XX3vixu02aLhWwyRPylBi2', 'customer', '081234567892', 'P', NULL, '2025-11-21 09:18:15', '2025-11-21 09:18:15'),
(4, 'Ahmad Fauzi', 'ahmad@example.com', NULL, '$2y$12$5QkpW8uO9ol9FiIAdRPxG.wuPLC.OCscB9xbeP6doDHpuL9bOl.XK', 'customer', '081234567893', 'L', NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16'),
(5, 'Dewi Lestari', 'dewi@example.com', NULL, '$2y$12$dKUrTBfrtLPw8hPnj74Zm..Y9hukAzAFy2bfiAXR.GgFQo3fZjuae', 'customer', '081234567894', 'P', NULL, '2025-11-21 09:18:16', '2025-11-21 09:18:16');

-- --------------------------------------------------------

--
-- Table structure for table `wishlists`
--

CREATE TABLE `wishlists` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `produk_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alamat_user`
--
ALTER TABLE `alamat_user`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alamat_user_user_id_foreign` (`user_id`);

--
-- Indexes for table `banners`
--
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `item_keranjang`
--
ALTER TABLE `item_keranjang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_keranjang_keranjang_id_foreign` (`keranjang_id`),
  ADD KEY `item_keranjang_produk_id_foreign` (`produk_id`),
  ADD KEY `item_keranjang_varian_id_foreign` (`varian_id`);

--
-- Indexes for table `item_pesanan`
--
ALTER TABLE `item_pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_pesanan_pesanan_id_foreign` (`pesanan_id`),
  ADD KEY `item_pesanan_produk_id_foreign` (`produk_id`),
  ADD KEY `item_pesanan_varian_id_foreign` (`varian_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD PRIMARY KEY (`id`),
  ADD KEY `keranjang_user_id_foreign` (`user_id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_pesanan_id_foreign` (`pesanan_id`),
  ADD KEY `notifications_pembayaran_id_foreign` (`pembayaran_id`),
  ADD KEY `notifications_user_id_read_at_index` (`user_id`,`read_at`),
  ADD KEY `notifications_user_id_target_role_index` (`user_id`,`target_role`);

--
-- Indexes for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  ADD PRIMARY KEY (`id`),
  ADD KEY `password_reset_otps_email_index` (`email`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pembayaran_pesanan_id_foreign` (`pesanan_id`);

--
-- Indexes for table `pengiriman`
--
ALTER TABLE `pengiriman`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pengiriman_pesanan_id_foreign` (`pesanan_id`);

--
-- Indexes for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pesanan_user_id_foreign` (`user_id`);

--
-- Indexes for table `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produk_idkategori_foreign` (`idKategori`);

--
-- Indexes for table `produk_varian`
--
ALTER TABLE `produk_varian`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produk_varian_produk_id_foreign` (`produk_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `wishlists_user_id_produk_id_unique` (`user_id`,`produk_id`),
  ADD KEY `wishlists_produk_id_foreign` (`produk_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alamat_user`
--
ALTER TABLE `alamat_user`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `banners`
--
ALTER TABLE `banners`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_keranjang`
--
ALTER TABLE `item_keranjang`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `item_pesanan`
--
ALTER TABLE `item_pesanan`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `keranjang`
--
ALTER TABLE `keranjang`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `password_reset_otps`
--
ALTER TABLE `password_reset_otps`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengiriman`
--
ALTER TABLE `pengiriman`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produk`
--
ALTER TABLE `produk`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `produk_varian`
--
ALTER TABLE `produk_varian`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `wishlists`
--
ALTER TABLE `wishlists`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `alamat_user`
--
ALTER TABLE `alamat_user`
  ADD CONSTRAINT `alamat_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `item_keranjang`
--
ALTER TABLE `item_keranjang`
  ADD CONSTRAINT `item_keranjang_keranjang_id_foreign` FOREIGN KEY (`keranjang_id`) REFERENCES `keranjang` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `item_keranjang_produk_id_foreign` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `item_keranjang_varian_id_foreign` FOREIGN KEY (`varian_id`) REFERENCES `produk_varian` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `item_pesanan`
--
ALTER TABLE `item_pesanan`
  ADD CONSTRAINT `item_pesanan_pesanan_id_foreign` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `item_pesanan_produk_id_foreign` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `item_pesanan_varian_id_foreign` FOREIGN KEY (`varian_id`) REFERENCES `produk_varian` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `keranjang`
--
ALTER TABLE `keranjang`
  ADD CONSTRAINT `keranjang_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_pembayaran_id_foreign` FOREIGN KEY (`pembayaran_id`) REFERENCES `pembayaran` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_pesanan_id_foreign` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `pembayaran_pesanan_id_foreign` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pengiriman`
--
ALTER TABLE `pengiriman`
  ADD CONSTRAINT `pengiriman_pesanan_id_foreign` FOREIGN KEY (`pesanan_id`) REFERENCES `pesanan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD CONSTRAINT `pesanan_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `produk`
--
ALTER TABLE `produk`
  ADD CONSTRAINT `produk_idkategori_foreign` FOREIGN KEY (`idKategori`) REFERENCES `kategori` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `produk_varian`
--
ALTER TABLE `produk_varian`
  ADD CONSTRAINT `produk_varian_produk_id_foreign` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `wishlists`
--
ALTER TABLE `wishlists`
  ADD CONSTRAINT `wishlists_produk_id_foreign` FOREIGN KEY (`produk_id`) REFERENCES `produk` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlists_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
