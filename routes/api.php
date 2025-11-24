<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Illuminate\http\Request;

Route::group(['middleware' => 'api', 'prefix' => 'auth'], function ($router) {
    Route::post('register', [AuthController::class,'register']);
    Route::post('login', [AuthController::class,'login']);
    Route::post('logout', [AuthController::class,'logout']);
    Route::post('refresh', [AuthController::class,'refresh']);
    Route::post('me', [AuthController::class,'me']);
    Route::get('user', [AuthController::class,'me']); // Alias for GET request
    Route::post('send-otp', [AuthController::class, 'sendOtp']);
    Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('reset-password-otp', [AuthController::class, 'resetPasswordWithOtp']);
    Route::post('change-password', [AuthController::class, 'changePassword'])->middleware('jwt.auth');
});

use App\Http\Controllers\Admin\ProdukController as AdminProdukController;
use App\Http\Controllers\Admin\KategoriController as AdminKategoriController;
use App\Http\Controllers\ProdukController as ProdukController;
use App\Http\Controllers\BannerController;
use App\Http\Controllers\WilayahController;

// PUBLIC (lihat produk)
Route::get('/produk',        [ProdukController::class, 'index']);
Route::get('/produk/{id}',   [ProdukController::class, 'show']);
Route::get('/banners',       [BannerController::class, 'index']);
Route::get('/kategori',      [AdminKategoriController::class, 'index']);

// Wilayah Indonesia (Public)
Route::get('/wilayah/provinces', [WilayahController::class, 'getProvinces']);
Route::get('/wilayah/cities/{provinceCode}', [WilayahController::class, 'getCities']);
Route::get('/wilayah/districts/{cityCode}', [WilayahController::class, 'getDistricts']);
Route::get('/wilayah/villages/{districtCode}', [WilayahController::class, 'getVillages']);

// Tracking (Public - untuk cek resi)
use App\Http\Controllers\TrackingController;
Route::get('/tracking', [TrackingController::class, 'track']);
Route::get('/tracking/couriers', [TrackingController::class, 'couriers']);

// ADMIN (CRUD penuh)
Route::middleware(['jwt.auth', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/produk', [AdminProdukController::class, 'index']);
    Route::post('/produk', [AdminProdukController::class, 'store']);
    Route::get('/produk/{id}', [AdminProdukController::class, 'show']);
    Route::put('/produk/{id}', [AdminProdukController::class, 'update']);
    Route::delete('/produk/{id}', [AdminProdukController::class, 'destroy']);

    Route::get('/kategori', [AdminKategoriController::class, 'index']);
    Route::post('/kategori', [AdminKategoriController::class, 'store']);
    Route::put('/kategori/{kategori}', [AdminKategoriController::class, 'update']);
    Route::delete('/kategori/{kategori}', [AdminKategoriController::class, 'destroy']);
});

use App\Http\Controllers\Customer\KeranjangController;
use App\Http\Controllers\Customer\PesananController as CustomerPesananController;
use App\Http\Controllers\Customer\AlamatController;
use App\Http\Controllers\Customer\WishlistController;
use App\Http\Controllers\Customer\NotificationController as CustomerNotificationController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ShippingController;

// CUSTOMER Routes
Route::middleware(['jwt.auth', 'role:customer'])->prefix('customer')->group(function () {
    // Profile
    Route::put('/profile', [AuthController::class, 'updateProfile']);  // Update profile
    
    // Alamat
    Route::get('/alamat', [AlamatController::class, 'index']);            // Get all addresses
    Route::get('/alamat/{id}', [AlamatController::class, 'show']);        // Get single address
    Route::post('/alamat', [AlamatController::class, 'store']);           // Create address
    Route::put('/alamat/{id}', [AlamatController::class, 'update']);      // Update address
    Route::delete('/alamat/{id}', [AlamatController::class, 'destroy']);  // Delete address
    Route::post('/alamat/{id}/set-default', [AlamatController::class, 'setDefault']); // Set as default
    Route::post('/alamat/{id}/force-update-area-id', [AlamatController::class, 'forceUpdateAreaId']); // Force update area_id
    
    // Keranjang
    Route::get('/keranjang', [KeranjangController::class, 'index']);      // Lihat isi keranjang
    Route::post('/keranjang', [KeranjangController::class, 'store']);     // Tambah produk ke keranjang
    Route::put('/keranjang/{id}', [KeranjangController::class, 'update']); // Ubah jumlah produk
    Route::delete('/keranjang/{id}', [KeranjangController::class, 'destroy']); // Hapus item
    Route::post('/buy-now', [KeranjangController::class, 'buyNow']);      // Beli sekarang (direct checkout)

    // Wishlist
    Route::get('/wishlist', [WishlistController::class, 'index']);       // Lihat wishlist pengguna
    Route::post('/wishlist', [WishlistController::class, 'store']);      // Tambah produk ke wishlist
    Route::delete('/wishlist/{produk}', [WishlistController::class, 'destroy']); // Hapus produk

    // Notifications
    Route::get('/notifications', [CustomerNotificationController::class, 'index']);
    Route::post('/notifications', [CustomerNotificationController::class, 'store']);
    Route::post('/notifications/{notification}/read', [CustomerNotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [CustomerNotificationController::class, 'markAllRead']);
    
    // Checkout
    Route::get('/checkout/summary', [CheckoutController::class, 'getSummary']);  // Get checkout summary
    Route::post('/checkout/shipping-rates', [CheckoutController::class, 'getShippingRates']); // Get shipping rates
    Route::post('/checkout/process', [CheckoutController::class, 'process']);     // Process checkout
    
    // Payment (Midtrans)
    Route::post('/payment/create-token', [PaymentController::class, 'createSnapToken']);  // Create Snap Token
    Route::post('/payment/check-status', [PaymentController::class, 'checkStatus']);      // Check payment status

    // Shipping (Biteship)
    Route::post('/shipping/rates', [ShippingController::class, 'calculateRates']);
    Route::post('/shipping/track', [ShippingController::class, 'trackShipment']);
    
    // Pesanan
    Route::get('/pesanan', [CustomerPesananController::class, 'index']);           // Lihat semua pesanan
    Route::get('/pesanan/{id}', [CustomerPesananController::class, 'show']);       // Detail pesanan
    Route::post('/pesanan', [CustomerPesananController::class, 'store']);          // Buat pesanan baru dari keranjang
    Route::put('/pesanan/{id}/status', [CustomerPesananController::class, 'updateStatus']); // Update status (batalkan atau selesai)
    Route::post('/pesanan/{id}/cancel', [CustomerPesananController::class, 'cancel']); // Batalkan pesanan
    Route::post('/pesanan/{id}/complete', [CustomerPesananController::class, 'complete']); // Selesaikan pesanan
    Route::post('/pesanan/{id}/rating', [CustomerPesananController::class, 'rate']); // Beri rating pesanan selesai
    Route::get('/pesanan/{id}/tracking', [CustomerPesananController::class, 'tracking']); // Lacak pengiriman via Biteship
});

// Midtrans Callbacks (No Auth - untuk webhook dan redirect dari Midtrans)
Route::post('/payment/notification', [CheckoutController::class, 'paymentNotification']);
Route::get('/payment/finish', [CheckoutController::class, 'paymentFinish']);
Route::post('/payment/notification-legacy', [PaymentController::class, 'handleNotification']); // Keep old route if exists

use App\Http\Controllers\Admin\PesananController as AdminPesananController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\BannerController as AdminBannerController;
use App\Http\Controllers\Admin\NotificationController as AdminNotificationController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\ExportController;

// ADMIN - Dashboard
Route::middleware(['jwt.auth', 'role:admin'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index']);
    
    // Export Reports
    Route::get('/export/orders/pdf', [ExportController::class, 'ordersPdf']);
    Route::get('/export/orders/excel', [ExportController::class, 'ordersExcel']);
    Route::get('/export/products/pdf', [ExportController::class, 'productsPdf']);
    Route::get('/export/products/excel', [ExportController::class, 'productsExcel']);
    Route::get('/export/revenue/pdf', [ExportController::class, 'revenuePdf']);
    Route::get('/export/revenue/excel', [ExportController::class, 'revenueExcel']);
    
    // Users Management
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/users/{id}', [AdminUserController::class, 'show']);
    Route::put('/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);
    
    // Banners
    Route::get('/banners', [AdminBannerController::class, 'index']);
    Route::post('/banners', [AdminBannerController::class, 'store']);
    Route::get('/banners/{id}', [AdminBannerController::class, 'show']);
    Route::put('/banners/{id}', [AdminBannerController::class, 'update']); // PUT method
    Route::post('/banners/{id}', [AdminBannerController::class, 'update']); // POST for file upload (FormData)
    Route::delete('/banners/{id}', [AdminBannerController::class, 'destroy']);
    
    // Note: Products & Categories admin routes already defined at line 28-38
    
    // Pesanan (Orders)
    Route::get('/pesanan', [AdminPesananController::class, 'index']);                     // Lihat semua pesanan
    Route::get('/pesanan/{id}', [AdminPesananController::class, 'show']);                 // Detail pesanan
    Route::put('/pesanan/{id}/status', [AdminPesananController::class, 'updateStatus']); // Update status manual
    Route::put('/pesanan/{id}/tracking', [AdminPesananController::class, 'updateTracking']); // Update tracking number
    Route::post('/pesanan/{id}/pack', [AdminPesananController::class, 'markAsPacked']);   // Belum Dibayar -> Dikemas
    Route::post('/pesanan/{id}/ship', [AdminPesananController::class, 'markAsShipped']); // Dikemas -> Dikirim
    Route::post('/pesanan/{id}/complete', [AdminPesananController::class, 'markAsCompleted']); // Dikirim -> Selesai
    Route::post('/pesanan/{id}/cancel', [AdminPesananController::class, 'cancel']);       // Batalkan pesanan
    
    // Orders (alias for English route naming)
    Route::get('/orders', [AdminPesananController::class, 'index']);
    Route::get('/orders/{id}', [AdminPesananController::class, 'show']);

    // Notifications
    Route::get('/notifications', [AdminNotificationController::class, 'index']);
    Route::post('/notifications', [AdminNotificationController::class, 'store']);
    Route::post('/notifications/{notification}/read', [AdminNotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [AdminNotificationController::class, 'markAllRead']);
});

