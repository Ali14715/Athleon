<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Produk;
use App\Models\Wishlist;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    public function index()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $items = Wishlist::with('produk')
                ->where('user_id', $user->id)
                ->latest()
                ->get();

            return $this->successResponse($items, 'Wishlist berhasil diambil');
        } catch (Exception $e) {
            return $this->serverErrorResponse('Terjadi kesalahan server: ' . $e->getMessage());
        }
    }

    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $validated = $request->validate([
                'produk_id' => 'required|exists:produk,id',
            ]);

            $produk = Produk::find($validated['produk_id']);
            if (!$produk) {
                return $this->notFoundResponse('Produk tidak ditemukan');
            }

            $wishlist = Wishlist::firstOrCreate([
                'user_id' => $user->id,
                'produk_id' => $produk->id,
            ]);

            $message = $wishlist->wasRecentlyCreated
                ? 'Produk ditambahkan ke wishlist'
                : 'Produk sudah ada di wishlist';

            if ($wishlist->wasRecentlyCreated) {
                return $this->createdResponse($wishlist->load('produk'), $message);
            }
            return $this->successResponse($wishlist->load('produk'), $message);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors(), 'Validasi gagal');
        } catch (Exception $e) {
            return $this->serverErrorResponse('Terjadi kesalahan server: ' . $e->getMessage());
        }
    }

    public function destroy(int $produkId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $wishlist = Wishlist::where('user_id', $user->id)
                ->where('produk_id', $produkId)
                ->first();

            if (!$wishlist) {
                return $this->notFoundResponse('Produk tidak ditemukan di wishlist');
            }

            $wishlist->delete();

            return $this->successResponse(null, 'Produk dihapus dari wishlist');
        } catch (Exception $e) {
            return $this->serverErrorResponse('Terjadi kesalahan server: ' . $e->getMessage());
        }
    }
}
