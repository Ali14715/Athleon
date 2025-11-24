<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PageController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Index');
    }

    public function catalog(): Response
    {
        return Inertia::render('Catalog');
    }

    public function login(): Response
    {
        return Inertia::render('Login');
    }

    public function forgotPassword(Request $request, ?string $token = null): Response
    {
        return Inertia::render('ResetPassword', [
            'token' => $token,
            'email' => $request->query('email'),
        ]);
    }

    public function cart(): Response
    {
        return Inertia::render('Cart');
    }

    public function checkout(): Response
    {
        return Inertia::render('Checkout');
    }

    public function profile(): Response
    {
        return Inertia::render('Profile');
    }

    public function orders(): Response
    {
        return Inertia::render('Orders');
    }

    public function orderDetail($id): Response
    {
        return Inertia::render('OrderDetail', [
            'id' => $id
        ]);
    }

    public function payment(): Response
    {
        return Inertia::render('Payment');
    }

    public function productDetail($name, $idencrypt): Response
    {
        // Decode the base64 encrypted ID
        $id = base64_decode($idencrypt);
        
        return Inertia::render('ProductDetail', [
            'id' => $id
        ]);
    }

    public function adminDashboard(): Response
    {
        return Inertia::render('admin/Dashboard');
    }

    public function adminBanners(): Response
    {
        return Inertia::render('admin/Banners');
    }

    public function adminProducts(): Response
    {
        return Inertia::render('admin/Products');
    }

    public function adminCategories(): Response
    {
        return Inertia::render('admin/Categories');
    }

    public function adminOrders(): Response
    {
        return Inertia::render('admin/Orders');
    }

    public function adminUsers(): Response
    {
        return Inertia::render('admin/Users');
    }
}
