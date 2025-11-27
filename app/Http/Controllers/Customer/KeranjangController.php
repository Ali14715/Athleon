<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Keranjang;
use App\Models\ItemKeranjang;
use App\Models\Produk;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Exception;

class KeranjangController extends Controller
{
    /**
     * Tampilkan keranjang user yang sedang login.
     */
    public function index()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $keranjang = Keranjang::with(['items.produk', 'items.varian'])
                ->where('user_id', $user->id)
                ->first();

            if (!$keranjang) {
                return $this->successResponse([], 'Keranjang kosong');
            }

            // Load multiple variants for each item
            foreach ($keranjang->items as $item) {
                if (!empty($item->varian_ids)) {
                    $item->varians = \App\Models\ProdukVarian::whereIn('id', $item->varian_ids)->get();
                }
            }

            return $this->successResponse($keranjang, 'Data keranjang ditemukan');
        } catch (Exception $e) {
            return $this->serverErrorResponse('Internal server error: ' . $e->getMessage());
        }
    }

    /**
     * Tambahkan produk ke keranjang.
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $validated = $request->validate([
                'produk_id' => 'required|exists:produk,id',
                'varian_id' => 'nullable|exists:produk_varian,id',
                'varian_ids' => 'nullable|array',
                'varian_ids.*' => 'exists:produk_varian,id',
                'jumlah' => 'required|integer|min:1'
            ]);

            $produk = Produk::find($validated['produk_id']);
            if (!$produk) {
                return $this->notFoundResponse('Produk tidak ditemukan');
            }

            // Jika stok 0 atau tidak ada, anggap unlimited stock
            if ($produk->stok > 0 && $validated['jumlah'] > $produk->stok) {
                return $this->validationErrorResponse(null, 'Stok produk tidak mencukupi. Stok tersedia: ' . $produk->stok);
            }

            DB::beginTransaction();

            $hargaFinal = $produk->harga;
            $varianIds = $validated['varian_ids'] ?? ((isset($validated['varian_id']) && $validated['varian_id']) ? [$validated['varian_id']] : []);
            $varianLabel = null;
            
            // Calculate combined price from all selected variants (Size + Warna)
            if (!empty($varianIds)) {
                $varians = \App\Models\ProdukVarian::whereIn('id', $varianIds)
                    ->where('produk_id', $produk->id)
                    ->get();
                
                if ($varians->count() !== count($varianIds)) {
                    return $this->notFoundResponse('Satu atau lebih varian tidak ditemukan');
                }
                
                // Build variant label and calculate price
                $labels = [];
                foreach ($varians as $v) {
                    if ($v->stok > 0 && $validated['jumlah'] > $v->stok) {
                        return $this->validationErrorResponse(null, "Stok varian {$v->nilai_varian} tidak mencukupi. Stok tersedia: {$v->stok}");
                    }
                    $hargaFinal += $v->harga_tambahan;
                    $labels[] = $v->nama_varian . ': ' . $v->nilai_varian;
                }
                $varianLabel = implode(', ', $labels);
            }

            $keranjang = Keranjang::firstOrCreate(['user_id' => $user->id]);
            
            // Find existing item with same variant combination
            $query = ItemKeranjang::where('keranjang_id', $keranjang->id)
                ->where('produk_id', $produk->id);
            
            if (empty($varianIds)) {
                $query->whereNull('varian_ids');
            } else {
                // MySQL JSON comparison for exact array match
                $query->whereRaw('JSON_CONTAINS(varian_ids, ?)', [json_encode($varianIds)])
                      ->whereRaw('JSON_CONTAINS(?, varian_ids)', [json_encode($varianIds)]);
            }
            
            $item = $query->first();

            if ($item) {
                $item->jumlah += $validated['jumlah'];
                $item->subtotal = $item->jumlah * $hargaFinal;
                $item->save();
            } else {
                $item = ItemKeranjang::create([
                    'keranjang_id' => $keranjang->id,
                    'produk_id' => $produk->id,
                    'varian_id' => $validated['varian_id'] ?? null,
                    'varian_ids' => !empty($varianIds) ? $varianIds : null,
                    'varian_label' => $varianLabel,
                    'harga_varian' => $hargaFinal,
                    'jumlah' => $validated['jumlah'],
                    'subtotal' => $hargaFinal * $validated['jumlah'],
                ]);
            }

            // Update total harga keranjang
            $keranjang->total_harga = ItemKeranjang::where('keranjang_id', $keranjang->id)->sum('subtotal');
            $keranjang->save();

            DB::commit();

            return $this->createdResponse($item, 'Produk berhasil ditambahkan ke keranjang');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors(), 'Validasi gagal');
        } catch (Exception $e) {
            DB::rollBack();
            return $this->serverErrorResponse('Terjadi kesalahan server: ' . $e->getMessage());
        }
    }

    /**
     * Update jumlah item di keranjang.
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $validated = $request->validate([
                'jumlah' => 'required|integer|min:1',
                'varian_id' => 'nullable|exists:produk_varian,id',
                'varian_ids' => 'nullable|array',
                'varian_ids.*' => 'exists:produk_varian,id'
            ]);

            $item = ItemKeranjang::find($id);
            if (!$item) {
                return $this->notFoundResponse('Item keranjang tidak ditemukan');
            }

            $produk = Produk::find($item->produk_id);
            
            // Calculate final price based on variant(s)
            $hargaFinal = $produk->harga;
            
            // Check if user is updating variants
            $hasNewVariants = isset($validated['varian_ids']) || array_key_exists('varian_id', $validated);
            
            if ($hasNewVariants) {
                $varianIds = $validated['varian_ids'] ?? ((isset($validated['varian_id']) && $validated['varian_id']) ? [$validated['varian_id']] : []);
            } else {
                $varianIds = $item->varian_ids ?? ($item->varian_id ? [$item->varian_id] : []);
            }
            
            if (!empty($varianIds)) {
                $varians = \App\Models\ProdukVarian::whereIn('id', $varianIds)
                    ->where('produk_id', $produk->id)
                    ->get();
                
                if ($varians->count() !== count($varianIds)) {
                    return $this->notFoundResponse('Satu atau lebih varian tidak ditemukan');
                }
                
                $labels = [];
                foreach ($varians as $v) {
                    if ($v->stok > 0 && $validated['jumlah'] > $v->stok) {
                        return $this->validationErrorResponse(null, "Stok varian {$v->nilai_varian} tidak mencukupi. Stok tersedia: {$v->stok}");
                    }
                    $hargaFinal += $v->harga_tambahan;
                    $labels[] = $v->nama_varian . ': ' . $v->nilai_varian;
                }
                
                if ($hasNewVariants) {
                    $item->varian_id = $validated['varian_id'] ?? null;
                    $item->varian_ids = $varianIds;
                    $item->varian_label = implode(', ', $labels);
                    $item->harga_varian = $hargaFinal;
                }
            } else if ($produk->stok > 0 && $validated['jumlah'] > $produk->stok) {
                return $this->validationErrorResponse(null, 'Stok produk tidak mencukupi. Stok tersedia: ' . $produk->stok);
            }

            $item->jumlah = $validated['jumlah'];
            $item->subtotal = $hargaFinal * $validated['jumlah'];
            $item->save();

            $keranjang = Keranjang::find($item->keranjang_id);
            $keranjang->total_harga = ItemKeranjang::where('keranjang_id', $keranjang->id)->sum('subtotal');
            $keranjang->save();

            // Reload item with varian relation and load multiple variants
            $item->load('varian');
            if (!empty($item->varian_ids)) {
                $item->varians = \App\Models\ProdukVarian::whereIn('id', $item->varian_ids)->get();
            }

            return $this->successResponse($item, 'Item berhasil diperbarui');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors(), 'Validasi gagal');
        } catch (Exception $e) {
            return $this->serverErrorResponse('Terjadi kesalahan server: ' . $e->getMessage());
        }
    }

    /**
     * Hapus item dari keranjang.
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $item = ItemKeranjang::find($id);
            if (!$item) {
                return $this->notFoundResponse('Item keranjang tidak ditemukan');
            }

            $keranjang = Keranjang::find($item->keranjang_id);
            $item->delete();

            $keranjang->total_harga = ItemKeranjang::where('keranjang_id', $keranjang->id)->sum('subtotal');
            $keranjang->save();

            return $this->successResponse(null, 'Item berhasil dihapus dari keranjang');
        } catch (Exception $e) {
            return $this->serverErrorResponse('Terjadi kesalahan server: ' . $e->getMessage());
        }
    }

    /**
     * Buy Now - Langsung ke checkout tanpa masuk keranjang
     */
    public function buyNow(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $validated = $request->validate([
                'produk_id' => 'required|exists:produk,id',
                'varian_ids' => 'nullable|array',
                'varian_ids.*' => 'exists:produk_varian,id',
                'jumlah' => 'required|integer|min:1'
            ]);

            $produk = Produk::with(['varians'])->find($validated['produk_id']);
            if (!$produk) {
                return $this->notFoundResponse('Produk tidak ditemukan');
            }

            // Check stock
            if ($produk->stok > 0 && $validated['jumlah'] > $produk->stok) {
                return $this->validationErrorResponse(null, 'Stok produk tidak mencukupi. Stok tersedia: ' . $produk->stok);
            }

            $hargaFinal = $produk->harga;
            $varianIds = $validated['varian_ids'] ?? [];
            
            // Calculate price with variants
            if (!empty($varianIds)) {
                foreach ($varianIds as $varianId) {
                    $varian = \App\Models\ProdukVarian::find($varianId);
                    if ($varian) {
                        $hargaFinal += $varian->harga_tambahan;
                    }
                }
            }

            $subtotal = $hargaFinal * $validated['jumlah'];

            // Return item data untuk langsung ke checkout
            $item = [
                'produk_id' => $produk->id,
                'produk' => $produk,
                'varian_ids' => $varianIds,
                'varians' => !empty($varianIds) ? \App\Models\ProdukVarian::whereIn('id', $varianIds)->get() : [],
                'jumlah' => $validated['jumlah'],
                'harga' => $hargaFinal,
                'subtotal' => $subtotal,
            ];

            return $this->successResponse($item, 'Produk siap untuk checkout');
        } catch (Exception $e) {
            return $this->serverErrorResponse('Terjadi kesalahan server: ' . $e->getMessage());
        }
    }
}
