# Changelog - Athleon E-Commerce

## [Latest Updates] - November 25, 2025

### 🐛 Bug Fixes

#### Checkout & Shipping
- **Fixed**: Checkout page tidak menampilkan metode pengiriman untuk alamat default dengan `area_id` NULL
  - Added warning system untuk address dengan `area_id` missing
  - Implemented 3-pattern fallback search di Biteship API:
    1. Kelurahan + Kota
    2. Kota saja
    3. Kelurahan saja
  - Logs ditambahkan untuk troubleshooting

- **Fixed**: Double radio selection untuk JNE REG dan SiCepat REG
  - Changed RadioGroup value dari `courier_service_code` ke compound key: `${courier_code}-${courier_service_code}`
  - Ensures unique selection per shipping method

#### Payment & Order Management
- **Fixed**: UI tidak terupdate setelah payment confirmation
  - Added `$pesanan->refresh()` di controller setelah status update
  - Added cache control headers: `no-cache, no-store, must-revalidate`
  - Added 1 second delay untuk sync dengan Midtrans webhook

- **Fixed**: SQL error "Column 'stok_dikurangi' not found"
  - Removed `stok_dikurangi` column references dari:
    - `app/Models/Pesanan.php` (fillable, casts)
    - `app/Http/Controllers/PaymentController.php`
    - `app/Http/Controllers/Admin/PesananController.php`
  - Stock reduction logic sekarang berdasarkan status change dari non-"Dikemas" ke "Dikemas"

#### Variant Handling
- **Fixed**: Error "Call to undefined relationship [varians]" untuk produk tanpa varian
  - Added `loadVariants()` helper method di `app/Models/ItemKeranjang.php`
  - Changed dari relationship ke manual loading dengan try-catch
  - Checkout process sekarang handle produk dengan dan tanpa varian

### 🔒 Security & Privacy

#### URL & Callback Improvements
- **Updated**: Midtrans callback URL tidak lagi expose query parameters
  - Changed dari: `http://127.0.0.1:8000/orders?payment_success=1`
  - Menjadi: `http://127.0.0.1:8000/orders`
  - Prevents information leakage via URL parameters

- **Updated**: Order ID format di UI untuk hide database ID
  - Frontend display format: `ATH{id_4digit}{timestamp_3digit}`
  - Contoh: Order #7 ditampilkan sebagai "ATH0007123"
  - Added `formatOrderId()` helper di:
    - `resources/js/pages/Orders.tsx`
    - `resources/js/pages/OrderDetail.tsx`

#### Product Links
- **Fixed**: Product links di Cart dan OrderDetail menggunakan plain ID (404 error)
  - Updated link format ke: `/product/{product-name-slug}/{btoa(id)}`
  - Matching format dengan ProductCard component
  - Product ID sekarang encrypted dengan base64

### 🎨 UI/UX Improvements

#### Currency Formatting
- **Fixed**: Currency display showing "Rp 1000.000" instead of "Rp 1.000"
  - Added `formatRupiah()` helper function di `resources/js/lib/utils.ts`
  - Using `Intl.NumberFormat("id-ID")` untuk Indonesian locale
  - Applied across all pages (Cart, Checkout, OrderDetail)

#### Badge Styling
- **Updated**: Notification badge styling untuk konsistensi dengan cart badge
  - Removed `variant="destructive"`
  - Standardized size: `h-5 w-5` (sama dengan cart badge)
  - Changed color: `from-orange-500 to-amber-500` (orange gradient)
  - Added explicit `text-white` dan proper border styling
  - Cart badge tetap hijau emerald untuk diferensiasi

#### Product Navigation
- **Enhanced**: Added clickable product links di Cart dan Order History
  - Product images dan names sekarang linkable
  - Hover effects: opacity-80 untuk images, text-primary untuk names
  - Quick navigation ke product detail page

### 📝 Props & Component Fixes
- **Fixed**: OrderDetail component props mismatch
  - Changed props dari `orderId: number` ke `id: number`
  - Updated PageController untuk pass `id` instead of `orderId`

### 📄 Documentation Updates
- **Updated**: `docs/DATABASE_SCHEMA.md`
  - Removed `stok_dikurangi` column dari pesanan table
  - Added business rules untuk stock management
  - Added notes untuk order ID display format
  - Updated variant handling documentation

- **Updated**: `docs/athleon-api-docs.md`
  - Removed `stok_dikurangi` dari ERD diagram
  - Updated checkout flow documentation

- **Updated**: `docs/SEQUENCE_DIAGRAM.md`
  - Added area_id fallback flow (3-pattern Biteship search)
  - Updated variant handling in checkout process
  - Added clean callback URL notes
  - Updated stock reduction flow in pack order
  - Added RadioGroup compound key usage

- **Updated**: `docs/STATE_DIAGRAM.md`
  - Added stock reduction note in "Dikemas" state
  - Updated order status table with stock reduction info
  - Added frontend display format notes

- **Updated**: `docs/DATA_FLOW_DIAGRAM.md`
  - Added variant loading via loadVariants() method
  - Added area_id fallback check flow
  - Added automatic stock reduction in order processing
  - Added clean callback URL in payment flow
  - Added RadioGroup unique keys note

- **Added**: `docs/CHANGELOG.md` (this file)
  - Comprehensive change log untuk tracking semua updates

### 🗂️ Git & Development
- **Updated**: `.gitignore`
  - Added `/storage/logs/*.log`
  - Added `npm-debug.log`
  - Added `yarn-error.log`

---

## Technical Details

### Modified Files Summary

#### Backend (PHP/Laravel)
- `app/Models/Pesanan.php` - Removed stok_dikurangi
- `app/Models/ItemKeranjang.php` - Added loadVariants() method
- `app/Http/Controllers/CheckoutController.php` - Variant handling, callback URL
- `app/Http/Controllers/PaymentController.php` - Stock management logic
- `app/Http/Controllers/Admin/PesananController.php` - Stock reduction
- `app/Http/Controllers/Customer/PesananController.php` - Cache headers, refresh
- `app/Http/Controllers/PageController.php` - Props fix
- `app/Services/BiteshipService.php` - 3-pattern fallback search

#### Frontend (React/TypeScript)
- `resources/js/pages/Orders.tsx` - Order ID formatting
- `resources/js/pages/OrderDetail.tsx` - Order ID, product links, props
- `resources/js/pages/Cart.tsx` - Product links, currency
- `resources/js/lib/utils.ts` - formatRupiah helper
- `resources/js/components/Navbar.tsx` - Badge styling
- `resources/js/components/ProductCard.tsx` - Reference for link format

#### Documentation
- `docs/DATABASE_SCHEMA.md` - Schema updates
- `docs/athleon-api-docs.md` - API documentation
- `docs/CHANGELOG.md` - This changelog

#### Configuration
- `.gitignore` - Log files

---

## Migration Notes

### Breaking Changes
None. All changes are backward compatible.

### Required Actions
1. **Database**: No migration needed (stok_dikurangi column was already removed from database)
2. **Frontend Build**: Run `npm run build` atau `npm run dev` untuk compile React changes
3. **Cache Clear**: Run `php artisan cache:clear` untuk clear application cache
4. **Testing**: Test checkout flow dengan produk yang punya dan tidak punya varian

### Recommended Testing Checklist
- [ ] Checkout dengan alamat yang punya area_id NULL
- [ ] Checkout dengan produk tanpa varian
- [ ] Checkout dengan produk dengan multiple varian
- [ ] Payment status update setelah Midtrans callback
- [ ] Order history menampilkan format order ID yang benar (ATH format)
- [ ] Product links di cart dan order detail bekerja dengan baik
- [ ] Currency formatting di semua halaman
- [ ] Notification badge styling (orange) vs cart badge (green)

---

## Known Issues & Future Improvements

### Known Issues
None at this time.

### Planned Improvements
1. Add order tracking integration dengan Biteship
2. Implement wishlist functionality
3. Add product comparison feature
4. Enhanced product filtering dan sorting
5. Add email notifications untuk order updates
6. Implement product review system
7. Add customer support chat

---

## Contributors
- Development Team - Athleon E-Commerce
- Last Updated: November 25, 2025
