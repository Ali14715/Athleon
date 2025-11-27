<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Produk;
use Illuminate\Http\Request;

class ProdukController extends Controller
{
    // List semua produk dengan filter
    public function index(Request $request)
    {
        $query = Produk::with(['varians', 'kategori']);

        // Filter by category
        if ($request->has('category') && $request->category !== 'all') {
            $query->whereHas('kategori', function ($q) use ($request) {
                $q->where('nama', 'like', '%' . $request->category . '%');
            });
        }

        // Filter by gender
        if ($request->has('gender') && $request->gender !== 'all') {
            $query->where('jenisKelamin', $request->gender);
        }

        // Filter by price range
        if ($request->has('min_price')) {
            $query->where('harga', '>=', $request->min_price);
        }
        if ($request->has('max_price')) {
            $query->where('harga', '<=', $request->max_price);
        }

        // Search by name
        if ($request->has('search') && $request->search !== '') {
            $query->where('nama', 'like', '%' . $request->search . '%');
        }

        // Sort
        $sortBy = $request->get('sort', 'newest');
        switch ($sortBy) {
            case 'price-low':
                $query->orderBy('harga', 'asc');
                break;
            case 'price-high':
                $query->orderBy('harga', 'desc');
                break;
            case 'name-asc':
                $query->orderBy('nama', 'asc');
                break;
            case 'name-desc':
                $query->orderBy('nama', 'desc');
                break;
            default: // newest
                $query->orderBy('id', 'desc');
                break;
        }

        $produk = $query->paginate(12);

        return $this->paginatedResponse($produk, 'Daftar produk berhasil diambil');
    }

    // Detail produk
    public function show($id)
    {
        $produk = Produk::with(['varians', 'kategori'])->find($id);

        if (!$produk) {
            return $this->notFoundResponse('Produk tidak ditemukan');
        }

        return $this->successResponse($produk, 'Produk retrieved successfully');
    }
}
