# Database Schema Documentation

## Overview
Database untuk sistem e-commerce Athleon yang menangani manajemen produk, pesanan, pembayaran, dan pengiriman dengan integrasi Midtrans dan Biteship.

## Recent Updates (Nov 2025)

### API Response Standardization (v2.0)
All API endpoints now return standardized responses using `ApiResponseTrait`:

```php
// Standard Success Response
{
    "status_code": 200,
    "message": "Operation berhasil",
    "data": { ... }
}

// Error Response
{
    "status_code": 400,
    "message": "Error message",
    "data": null
}
```

### New Components
- **ApiResponseTrait** (`app/Traits/ApiResponseTrait.php`): Centralized response handling
- **JWT Refresh**: `/api/auth/refresh` endpoint for token rotation

---

## Tables

### 1. **users**
Menyimpan data pengguna (admin dan customer).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| name | VARCHAR(255) | NOT NULL | Nama lengkap pengguna |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email untuk login |
| email_verified_at | TIMESTAMP | NULLABLE | Waktu verifikasi email |
| password | VARCHAR(255) | NOT NULL | Password ter-hash |
| telepon | VARCHAR(20) | NULLABLE | Nomor telepon |
| jenis_kelamin | ENUM('L','P') | NULLABLE | L=Laki-laki, P=Perempuan |
| role | ENUM('admin','customer') | DEFAULT 'customer' | Role pengguna |
| remember_token | VARCHAR(100) | NULLABLE | Token remember me |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update terakhir |

**Business Rules:**
- Email harus unique
- Password minimal 8 karakter
- Role default adalah 'customer'
- Admin tidak bisa self-delete

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (email)
- INDEX (role) - untuk filter by role

---

### 2. **password_reset_otps**
Menyimpan OTP untuk reset password.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| email | VARCHAR(255) | NOT NULL | Email penerima OTP |
| otp | VARCHAR(6) | NOT NULL | Kode OTP 6 digit |
| expires_at | TIMESTAMP | NOT NULL | Waktu kadaluarsa OTP |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- OTP berlaku 5 menit
- OTP hanya bisa digunakan sekali
- OTP dihapus setelah berhasil digunakan

**Indexes:**
- PRIMARY KEY (id)
- INDEX (email, otp) - untuk pencarian cepat
- INDEX (expires_at) - untuk cleanup expired OTP

---

### 3. **kategori**
Kategori produk.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| nama | VARCHAR(255) | NOT NULL | Nama kategori |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly identifier |
| deskripsi | TEXT | NULLABLE | Deskripsi kategori |
| gambar | VARCHAR(255) | NULLABLE | Path gambar kategori |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- Slug auto-generated dari nama
- Kategori tidak bisa dihapus jika ada produk terkait
- Gambar optional

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (slug)
- INDEX (nama) - untuk pencarian

---

### 4. **produk**
Produk yang dijual.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| nama | VARCHAR(255) | NOT NULL | Nama produk |
| slug | VARCHAR(255) | UNIQUE, NOT NULL | URL-friendly identifier |
| deskripsi | TEXT | NULLABLE | Deskripsi lengkap produk |
| harga | DECIMAL(10,2) | NOT NULL | Harga dasar produk |
| stok | INTEGER | DEFAULT 0 | Jumlah stok tersedia |
| kategori_id | BIGINT UNSIGNED | FK, NULLABLE | Reference ke kategori |
| gambar | VARCHAR(255) | NULLABLE | Path gambar utama |
| berat | INTEGER | DEFAULT 1000 | Berat dalam gram (untuk ongkir) |
| is_active | BOOLEAN | DEFAULT 1 | Status aktif produk |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- Harga harus > 0
- Stok tidak boleh negatif
- Produk inactive tidak muncul di katalog public
- Berat minimal 1 gram untuk kalkulasi ongkir

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (slug)
- FOREIGN KEY (kategori_id) REFERENCES kategori(id)
- INDEX (kategori_id, is_active) - untuk filter produk aktif by kategori
- INDEX (nama) - untuk search

---

### 5. **produk_varian**
Varian produk (ukuran, warna, dll).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| produk_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke produk |
| nama_varian | VARCHAR(100) | NOT NULL | Nama varian (Size, Color, dll) |
| nilai_varian | VARCHAR(100) | NOT NULL | Nilai varian (M, Red, dll) |
| harga_tambahan | DECIMAL(10,2) | DEFAULT 0 | Tambahan harga untuk varian |
| stok_varian | INTEGER | DEFAULT 0 | Stok khusus varian |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- Satu produk bisa punya multiple varian
- Harga final = produk.harga + SUM(varian.harga_tambahan)
- Stok varian terpisah dari stok produk utama

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
- INDEX (produk_id, nama_varian) - untuk query varian by product

---

### 6. **banners**
Banner promosi untuk homepage.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| judul | VARCHAR(255) | NOT NULL | Judul banner |
| gambar | VARCHAR(255) | NOT NULL | Path gambar banner |
| link | VARCHAR(255) | NULLABLE | URL redirect banner |
| urutan | INTEGER | DEFAULT 0 | Urutan tampil banner |
| is_active | BOOLEAN | DEFAULT 1 | Status aktif banner |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- Banner inactive tidak ditampilkan
- Urutan menentukan posisi tampil (ASC)
- Link optional untuk banner informatif

**Indexes:**
- PRIMARY KEY (id)
- INDEX (is_active, urutan) - untuk query banner aktif sorted

---

### 7. **keranjang**
Keranjang belanja per user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| user_id | BIGINT UNSIGNED | FK, UNIQUE, NOT NULL | One cart per user |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- Setiap user hanya punya 1 keranjang
- Keranjang auto-created saat user pertama add item
- Keranjang dikosongkan setelah checkout

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (user_id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE

---

### 8. **item_keranjang**
Item dalam keranjang.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| keranjang_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke keranjang |
| produk_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke produk |
| jumlah | INTEGER | NOT NULL, CHECK > 0 | Jumlah item |
| harga_satuan | DECIMAL(10,2) | NOT NULL | Harga saat ditambahkan |
| harga_varian | DECIMAL(10,2) | DEFAULT 0 | Total harga varian |
| varian_ids | JSON | NULLABLE | Array ID varian yang dipilih |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- Jumlah harus > 0
- Harga snapshot saat add to cart
- Varian_ids berisi array ID dari produk_varian
- Total harga item = (harga_satuan + harga_varian) * jumlah

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (keranjang_id) REFERENCES keranjang(id) ON DELETE CASCADE
- FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
- UNIQUE KEY (keranjang_id, produk_id, varian_ids) - prevent duplicate items

---

### 9. **alamat_user**
Alamat pengiriman user.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| user_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke user |
| label | VARCHAR(100) | NOT NULL | Label alamat (Rumah, Kantor) |
| nama_penerima | VARCHAR(255) | NOT NULL | Nama penerima paket |
| telepon_penerima | VARCHAR(20) | NOT NULL | Nomor telepon penerima |
| alamat_lengkap | TEXT | NOT NULL | Alamat detail lengkap |
| provinsi | VARCHAR(255) | NOT NULL | Nama provinsi |
| kota | VARCHAR(255) | NOT NULL | Nama kota/kabupaten |
| kecamatan | VARCHAR(255) | NOT NULL | Nama kecamatan |
| kelurahan | VARCHAR(255) | NULLABLE | Nama kelurahan/desa |
| kode_pos | VARCHAR(10) | NULLABLE | Kode pos |
| area_id | VARCHAR(100) | NULLABLE | Biteship area ID |
| latitude | DECIMAL(10,8) | NULLABLE | Koordinat latitude |
| longitude | DECIMAL(11,8) | NULLABLE | Koordinat longitude |
| is_default | BOOLEAN | DEFAULT 0 | Alamat default untuk checkout |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- User bisa punya multiple alamat
- Hanya 1 alamat bisa jadi default per user
- Area_id digunakan untuk integrasi Biteship
- Provinsi, kota, kecamatan wajib diisi

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- INDEX (user_id, is_default) - untuk ambil alamat default
- INDEX (area_id) - untuk shipping calculation

---

### 10. **pesanan**
Order dari customer.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| user_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke user |
| kode_pesanan | VARCHAR(50) | UNIQUE, NOT NULL | Unique order code |
| nama_penerima | VARCHAR(255) | NOT NULL | Nama penerima paket |
| nomor_telepon | VARCHAR(20) | NOT NULL | Nomor telepon penerima |
| alamat_pengiriman | TEXT | NOT NULL | Alamat pengiriman lengkap |
| provinsi | VARCHAR(255) | NULLABLE | Provinsi tujuan |
| kota | VARCHAR(255) | NULLABLE | Kota tujuan |
| kecamatan | VARCHAR(255) | NULLABLE | Kecamatan tujuan |
| kode_pos | VARCHAR(10) | NULLABLE | Kode pos tujuan |
| area_id | VARCHAR(100) | NULLABLE | Biteship area ID |
| metode_pembayaran | VARCHAR(50) | NOT NULL | bank/ewallet/cod |
| metode_pengiriman | VARCHAR(255) | NOT NULL | Jasa pengiriman (JNE REG) |
| ongkir | DECIMAL(10,2) | DEFAULT 0 | Biaya pengiriman |
| total_harga | DECIMAL(10,2) | NOT NULL | Total harga pesanan |
| status | ENUM | NOT NULL | Status pesanan (lihat below) |
| catatan | TEXT | NULLABLE | Catatan dari customer |
| tracking_number | VARCHAR(100) | NULLABLE | Nomor resi pengiriman |
| shipping_courier_code | VARCHAR(50) | NULLABLE | Kode kurir (jne, tiki) |
| shipping_courier_service | VARCHAR(100) | NULLABLE | Service kurir (reg, oke) |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Status ENUM:** 'Belum Dibayar', 'Sudah Dibayar', 'Dikemas', 'Dikirim', 'Selesai', 'Dibatalkan'

**Business Rules:**
- Kode pesanan auto-generated (ORD-YYYYMMDD-XXXX)
- Status default: 'Belum Dibayar'
- Pesanan hanya bisa dibatalkan jika status 'Belum Dibayar' atau 'Sudah Dibayar'
- Tracking number wajib diisi saat status 'Dikirim'
- Stok produk otomatis dikurangi saat status berubah ke 'Dikemas'
- UI menampilkan order ID dalam format ATH{id_4digit}{timestamp_3digit} untuk keamanan

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (kode_pesanan)
- FOREIGN KEY (user_id) REFERENCES users(id)
- INDEX (user_id, status) - untuk filter pesanan user by status
- INDEX (status, created_at) - untuk admin dashboard
- INDEX (tracking_number) - untuk tracking

---

### 11. **item_pesanan**
Item dalam pesanan.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| pesanan_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke pesanan |
| produk_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke produk |
| nama_produk | VARCHAR(255) | NOT NULL | Snapshot nama produk |
| jumlah | INTEGER | NOT NULL | Jumlah item |
| harga_satuan | DECIMAL(10,2) | NOT NULL | Harga satuan saat order |
| harga_varian | DECIMAL(10,2) | DEFAULT 0 | Harga varian saat order |
| varian_ids | JSON | NULLABLE | Array ID varian |
| varian_detail | TEXT | NULLABLE | Detail varian (Size: M, Color: Red) |
| subtotal | DECIMAL(10,2) | NOT NULL | Subtotal item |
| rating | INTEGER | NULLABLE, CHECK 1-5 | Rating produk (1-5) |
| review | TEXT | NULLABLE | Review produk |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- Snapshot nama dan harga produk untuk history
- Rating hanya bisa diberikan setelah pesanan 'Selesai'
- Subtotal = (harga_satuan + harga_varian) * jumlah
- Varian handling menggunakan loadVariants() method untuk produk tanpa varian
- Produk bisa memiliki 0 atau lebih varian, sistem handle keduanya

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (pesanan_id) REFERENCES pesanan(id) ON DELETE CASCADE
- FOREIGN KEY (produk_id) REFERENCES produk(id)
- INDEX (pesanan_id) - untuk ambil items per order
- INDEX (produk_id, rating) - untuk rating produk

---

### 12. **pembayaran**
Payment records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| pesanan_id | BIGINT UNSIGNED | FK, UNIQUE, NOT NULL | One payment per order |
| metode | VARCHAR(50) | NOT NULL | Metode pembayaran |
| jumlah_bayar | DECIMAL(10,2) | NOT NULL | Jumlah yang dibayar |
| status | ENUM | NOT NULL | pending/paid/failed/expired |
| snap_token | VARCHAR(255) | NULLABLE | Midtrans Snap token |
| transaction_id | VARCHAR(255) | NULLABLE | Midtrans transaction ID |
| tanggal_bayar | TIMESTAMP | NULLABLE | Waktu pembayaran sukses |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Status ENUM:** 'pending', 'paid', 'failed', 'expired'

**Business Rules:**
- Setiap pesanan hanya punya 1 pembayaran
- Status 'paid' → pesanan status jadi 'Sudah Dibayar'
- Snap token untuk Midtrans payment gateway
- Transaction_id untuk tracking Midtrans

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (pesanan_id)
- FOREIGN KEY (pesanan_id) REFERENCES pesanan(id) ON DELETE CASCADE
- INDEX (transaction_id) - untuk webhook Midtrans
- INDEX (status) - untuk monitoring payment

---

### 13. **pengiriman**
Shipping records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| pesanan_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke pesanan |
| kurir | VARCHAR(100) | NOT NULL | Nama jasa kurir |
| service | VARCHAR(100) | NOT NULL | Service kurir |
| resi | VARCHAR(100) | NULLABLE | Nomor resi |
| estimasi | VARCHAR(50) | NULLABLE | Estimasi pengiriman |
| status | VARCHAR(50) | DEFAULT 'pending' | Status pengiriman |
| tracking_history | JSON | NULLABLE | History tracking dari API |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- Created saat pesanan status 'Dikemas'
- Resi wajib diisi saat status 'Dikirim'
- Tracking history updated via Biteship API

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (pesanan_id) REFERENCES pesanan(id) ON DELETE CASCADE
- INDEX (resi) - untuk tracking
- INDEX (status) - untuk monitoring

---

### 14. **wishlist**
Customer wishlist.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| user_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke user |
| produk_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke produk |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- User bisa add multiple produk ke wishlist
- Duplicate entry prevented by unique key
- Produk deleted = wishlist item deleted

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (produk_id) REFERENCES produk(id) ON DELETE CASCADE
- UNIQUE KEY (user_id, produk_id) - prevent duplicate

---

### 15. **notifications**
User notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT UNSIGNED | PK, AUTO_INCREMENT | Primary key |
| user_id | BIGINT UNSIGNED | FK, NOT NULL | Reference ke user |
| title | VARCHAR(255) | NOT NULL | Judul notifikasi |
| message | TEXT | NOT NULL | Isi notifikasi |
| type | VARCHAR(50) | NULLABLE | Tipe notifikasi |
| pembayaran_id | BIGINT UNSIGNED | FK, NULLABLE | Optional link ke payment |
| is_read | BOOLEAN | DEFAULT 0 | Status sudah dibaca |
| created_at | TIMESTAMP | NULLABLE | Waktu pembuatan |
| updated_at | TIMESTAMP | NULLABLE | Waktu update |

**Business Rules:**
- Notifikasi auto-created untuk event penting (payment success, order shipped)
- is_read untuk mark as read feature
- Type untuk kategorisasi (payment_success, order_update, etc)

**Indexes:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
- FOREIGN KEY (pembayaran_id) REFERENCES pembayaran(id) ON DELETE SET NULL
- INDEX (user_id, is_read, created_at) - untuk list notif unread sorted

---

## Performance Considerations

### Critical Indexes
1. **produk**: (kategori_id, is_active) - catalog browsing
2. **pesanan**: (user_id, status), (status, created_at) - order filtering
3. **item_pesanan**: (pesanan_id), (produk_id, rating) - order details & reviews
4. **notifications**: (user_id, is_read, created_at) - unread notifications

### Caching Strategy
- Cache kategori list (rarely changes)
- Cache produk list per kategori (invalidate on product update)
- Cache wilayah data (static data)
- Session-based cart caching

### Database Optimization
- Use DECIMAL for money values (avoid float precision issues)
- JSON columns for flexible data (varian_ids, tracking_history)
- Soft deletes untuk audit trail (optional implementation)
- Partitioning pesanan table by year (untuk scale besar)

---

## Data Integrity Rules

1. **Foreign Key Constraints**: ON DELETE CASCADE untuk dependent data, ON DELETE SET NULL untuk optional references
2. **Unique Constraints**: Email, slug, kode_pesanan untuk prevent duplicates
3. **Check Constraints**: Harga > 0, jumlah > 0, rating 1-5
4. **Default Values**: Status, role, timestamps untuk consistency

---

## Backup & Recovery

- **Daily Backup**: Full database backup
- **Transaction Logs**: Enable untuk point-in-time recovery
- **Retention**: 30 days rolling backup
- **Critical Tables**: users, pesanan, pembayaran (extra backup)
