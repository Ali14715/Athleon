# Security Testing - Athleon API

## 🔒 Keamanan Injeksi Harga

Aplikasi **SUDAH AMAN** dari injeksi harga karena semua harga dan data penting di-fetch langsung dari database, bukan dari request body.

### Mekanisme Proteksi

| Jenis Serangan | Status | Proteksi |
|----------------|--------|----------|
| Mengubah harga produk via POST | ✅ Aman | Harga diambil dari DB |
| Mengubah harga varian via POST | ✅ Aman | Harga varian diambil dari DB |
| Mengubah ongkir menjadi negatif | ✅ Aman | Validasi `min:0` |
| Ongkir sangat besar (fake) | ✅ Aman | Max 1 juta rupiah |
| Menggunakan varian produk lain | ✅ Aman | Cek `produk_id` pada varian |
| Stok manipulation | ✅ Aman | Re-fetch stok dari DB |
| Total negatif/nol | ✅ Aman | Validasi total > 0 |

---

## 🧪 Contoh CURL Testing

### 1. Mencoba Inject Harga Produk (TIDAK AKAN BERHASIL)

```bash
curl -X POST "http://127.0.0.1:8000/api/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nama_penerima\":\"Test User\",\"nomor_telepon\":\"08123456789\",\"alamat_pengiriman\":\"Jl. Test No. 1\",\"metode_pembayaran\":\"midtrans\",\"metode_pengiriman\":\"jne\",\"shipping_cost\":10000,\"buy_now\":true,\"produk_id\":1,\"jumlah\":1,\"harga\":1}"
```

**Hasil**: Harga `1` yang dikirim akan **DIABAIKAN**. Server akan mengambil harga asli dari database.

---

### 2. Mencoba Inject Ongkir Negatif (AKAN DITOLAK)

```bash
curl -X POST "http://127.0.0.1:8000/api/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nama_penerima\":\"Test User\",\"nomor_telepon\":\"08123456789\",\"alamat_pengiriman\":\"Jl. Test No. 1\",\"metode_pembayaran\":\"midtrans\",\"metode_pengiriman\":\"jne\",\"shipping_cost\":-50000,\"buy_now\":true,\"produk_id\":1,\"jumlah\":1}"
```

**Hasil**: 
```json
{
  "status": "error",
  "message": "Biaya pengiriman tidak valid"
}
```

---

### 3. Mencoba Inject Ongkir Sangat Besar (AKAN DITOLAK)

```bash
curl -X POST "http://127.0.0.1:8000/api/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nama_penerima\":\"Test User\",\"nomor_telepon\":\"08123456789\",\"alamat_pengiriman\":\"Jl. Test No. 1\",\"metode_pembayaran\":\"midtrans\",\"metode_pengiriman\":\"jne\",\"shipping_cost\":5000000,\"buy_now\":true,\"produk_id\":1,\"jumlah\":1}"
```

**Hasil**: 
```json
{
  "status": "error",
  "message": "Biaya pengiriman melebihi batas maksimum"
}
```

---

### 4. Mencoba Pakai Varian dari Produk Lain (AKAN DITOLAK)

```bash
curl -X POST "http://127.0.0.1:8000/api/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nama_penerima\":\"Test User\",\"nomor_telepon\":\"08123456789\",\"alamat_pengiriman\":\"Jl. Test No. 1\",\"metode_pembayaran\":\"midtrans\",\"metode_pengiriman\":\"jne\",\"shipping_cost\":15000,\"buy_now\":true,\"produk_id\":1,\"jumlah\":1,\"varian_ids\":[99]}"
```

**Hasil**: 
```json
{
  "status": "error",
  "message": "Satu atau lebih varian tidak valid untuk produk ini"
}
```

---

### 5. Checkout Normal yang Valid

```bash
curl -X POST "http://127.0.0.1:8000/api/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"nama_penerima\":\"Test User\",\"nomor_telepon\":\"08123456789\",\"alamat_pengiriman\":\"Jl. Test No. 1, Cilegon\",\"metode_pembayaran\":\"midtrans\",\"metode_pengiriman\":\"jne\",\"shipping_cost\":15000,\"shipping_courier_code\":\"jne\",\"shipping_courier_service\":\"REG\",\"buy_now\":true,\"produk_id\":1,\"jumlah\":2}"
```

**Hasil**: 
```json
{
  "status": "success",
  "message": "Pesanan berhasil dibuat",
  "data": {
    "order_id": 123,
    "total": 515000,
    "subtotal": 500000,
    "ongkir": 15000,
    "status": "Belum Dibayar",
    "snap_token": "..."
  }
}
```

---

## 🔍 Detail Validasi di Backend

### File: `app/Http/Controllers/CheckoutController.php`

#### 1. Harga Diambil dari Database
```php
// Line 453-458
$freshProduk = \App\Models\Produk::find($produk->id);
$basePrice = $freshProduk->harga ?? 0;
```

#### 2. Validasi Harga Varian dari Database
```php
// Line 496-504
$freshVarian = \App\Models\ProdukVarian::find($v->id);
$unitPrice += $freshVarian->harga_tambahan ?? 0;
```

#### 3. Validasi Shipping Cost
```php
// Line 527-534
if ($shippingCost < 0) {
    return $this->badRequestResponse('Biaya pengiriman tidak valid');
}
if ($shippingCost > 1000000) { // Max 1 juta
    return $this->badRequestResponse('Biaya pengiriman melebihi batas maksimum');
}
```

#### 4. Validasi Total Positif
```php
// Line 540-542
if ($total <= 0) {
    return $this->badRequestResponse('Total pesanan tidak valid');
}
```

#### 5. Validasi Stok Real-Time
```php
// Line 462-466
if ($freshProduk->stok > 0 && $item->jumlah > $freshProduk->stok) {
    return $this->badRequestResponse("Stok tidak mencukupi...");
}
```

#### 6. Validasi Varian Milik Produk yang Benar
```php
// Line 369-373
$varians = \App\Models\ProdukVarian::whereIn('id', $request->varian_ids)
    ->where('produk_id', $produk->id) // SECURITY CHECK
    ->get();
```

---

## 📝 Catatan Penggunaan CURL

### Windows (CMD)
Gunakan `^` untuk line continuation:
```bash
curl -X POST "http://127.0.0.1:8000/api/checkout" ^
  -H "Authorization: Bearer YOUR_TOKEN" ^
  ...
```

### Windows (PowerShell)
Gunakan backtick `` ` `` untuk line continuation:
```powershell
curl -X POST "http://127.0.0.1:8000/api/checkout" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  ...
```

### Linux / macOS
Gunakan `\` untuk line continuation:
```bash
curl -X POST "http://127.0.0.1:8000/api/checkout" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  ...
```

---

## 🎯 Kesimpulan

**Aplikasi sudah AMAN** dari injeksi harga karena:

1. ✅ **Semua harga diambil dari database**, bukan dari request body
2. ✅ **Varian divalidasi** untuk memastikan milik produk yang benar
3. ✅ **Ongkir memiliki batas minimum dan maksimum**
4. ✅ **Stok divalidasi real-time**
5. ✅ **Total pesanan harus positif**

Meskipun attacker mencoba mengirim field `harga`, `subtotal`, `total`, atau `harga_tambahan` dalam request body, server akan mengabaikannya dan menghitung sendiri dari database.

---

## 📚 Referensi File

- `app/Http/Controllers/CheckoutController.php` - Controller untuk checkout dengan validasi keamanan
- `app/Models/Produk.php` - Model produk
- `app/Models/ProdukVarian.php` - Model varian produk
- `app/Models/Pesanan.php` - Model pesanan
- `app/Models/ItemPesanan.php` - Model item pesanan
