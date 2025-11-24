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
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $items = Wishlist::with('produk')
                ->where('user_id', $user->id)
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Wishlist berhasil diambil',
                'data' => $items,
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $validated = $request->validate([
                'produk_id' => 'required|exists:produk,id',
            ]);

            $produk = Produk::find($validated['produk_id']);
            if (!$produk) {
                return response()->json(['success' => false, 'message' => 'Produk tidak ditemukan'], 404);
            }

            $wishlist = Wishlist::firstOrCreate([
                'user_id' => $user->id,
                'produk_id' => $produk->id,
            ]);

            $message = $wishlist->wasRecentlyCreated
                ? 'Produk ditambahkan ke wishlist'
                : 'Produk sudah ada di wishlist';

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $wishlist->load('produk'),
            ], $wishlist->wasRecentlyCreated ? 201 : 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(int $produkId)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
            }

            $wishlist = Wishlist::where('user_id', $user->id)
                ->where('produk_id', $produkId)
                ->first();

            if (!$wishlist) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak ditemukan di wishlist',
                ], 404);
            }

            $wishlist->delete();

            return response()->json([
                'success' => true,
                'message' => 'Produk dihapus dari wishlist',
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan server: ' . $e->getMessage(),
            ], 500);
        }
    }
}
