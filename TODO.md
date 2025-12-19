Berikut contoh **response API yang baik**, lengkap dari kondisi **sukses** sampai **error**, semua memakai format yang konsisten:

```
status_code
message
data
```

---

# ✅ **1. SUCCESS – 200 (OK)**

Data berhasil diambil.

```json
{
  "status_code": 200,
  "message": "Data retrieved successfully",
  "data": {
    "id": 1,
    "name": "Firdaus",
    "email": "firdaus@example.com"
  }
}
```

---

# ✅ **2. SUCCESS – 201 (Created)**

Data berhasil dibuat.

```json
{
  "status_code": 201,
  "message": "User created successfully",
  "data": {
    "id": 45,
    "username": "firdaus",
    "created_at": "2025-11-26T23:20:00Z"
  }
}
```

---

# ✅ **3. SUCCESS – 204 (No Content)**

Tidak ada data untuk ditampilkan, tapi request valid.
(Biasanya `data` dikirim **null** karena tidak boleh ada body untuk 204.)

```json
{
  "status_code": 204,
  "message": "No content",
  "data": null
}
```

---

# ❌ **4. ERROR – 400 (Bad Request)**

Request tidak sesuai aturan.

```json
{
  "status_code": 400,
  "message": "Bad request",
  "data": null
}
```

---

# ❌ **5. ERROR – 401 (Unauthorized)**

Token salah atau belum login.

```json
{
  "status_code": 401,
  "message": "Unauthorized",
  "data": null
}
```

---

# ❌ **6. ERROR – 403 (Forbidden)**

User tidak punya akses.

```json
{
  "status_code": 403,
  "message": "Forbidden",
  "data": null
}
```

---

# ❌ **7. ERROR – 404 (Not Found)**

Data tidak ditemukan.

```json
{
  "status_code": 404,
  "message": "Resource not found",
  "data": null
}
```

---

# ❌ **8. ERROR – 422 (Validation Error)**

Validasi gagal → error spesifik dikirim dalam `data`.

```json
{
  "status_code": 422,
  "message": "Validation error",
  "data": {
    "email": "Email is required",
    "password": "Password must be at least 6 characters"
  }
}
```

---

# ❌ **9. ERROR – 500 (Internal Server Error)**

Kesalahan server.

```json
{
  "status_code": 500,
  "message": "Internal server error",
  "data": null
}
```

---

# ❌ **10. ERROR – 503 (Service Unavailable)**

Server sedang down / maintenance.

```json
{
  "status_code": 503,
  "message": "Service unavailable",
  "data": null
}
```