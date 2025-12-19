<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PageController;

// Frontend Routes (Inertia)
Route::get('/', [PageController::class, 'index'])->name('home');
Route::get('/catalog', [PageController::class, 'catalog'])->name('catalog');
Route::get('/login', [PageController::class, 'login'])->name('login');
Route::get('/forgot-password', [PageController::class, 'forgotPassword'])->name('password.request');
Route::get('/reset-password', [PageController::class, 'forgotPassword'])->name('password.request');
Route::get('/reset-password/{token}', [PageController::class, 'forgotPassword'])->name('password.reset');
Route::get('/cart', [PageController::class, 'cart'])->name('cart');
Route::get('/checkout', [PageController::class, 'checkout'])->name('checkout');
Route::get('/profile', [PageController::class, 'profile'])->name('profile');
Route::get('/orders', [PageController::class, 'orders'])->name('orders');
Route::get('/payment/callback', [PageController::class, 'paymentCallback'])->name('payment.callback');
Route::get('/orders/{id}', [PageController::class, 'orderDetail'])->name('orders.detail');
Route::get('/payment', [PageController::class, 'payment'])->name('payment');
Route::get('/product/{name}/{idencrypt}', [PageController::class, 'productDetail'])->name('product.detail');

// Admin Routes
Route::get('/admin/dashboard', [PageController::class, 'adminDashboard'])->name('admin.dashboard');
Route::get('/admin/banners', [PageController::class, 'adminBanners'])->name('admin.banners');
Route::get('/admin/products', [PageController::class, 'adminProducts'])->name('admin.products');
Route::get('/admin/categories', [PageController::class, 'adminCategories'])->name('admin.categories');
Route::get('/admin/orders', [PageController::class, 'adminOrders'])->name('admin.orders');
Route::get('/admin/users', [PageController::class, 'adminUsers'])->name('admin.users');
