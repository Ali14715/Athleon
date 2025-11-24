<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\ItemPesanan;
use App\Models\Keranjang;
use App\Models\Notification;
use App\Services\BiteshipService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PesananController extends Controller
{
    /**
     * Tampilkan semua pesanan user yang login
     */
    public function index()
    {
        try {
            $user = auth()->user();
            
            // Clear any query cache to ensure fresh data
            \DB::connection()->disableQueryLog();
            
            $pesanan = Pesanan::where('user_id', $user->id)
                ->with(['items.produk', 'pembayaran'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $pesanan
            ], 200)->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                   ->header('Pragma', 'no-cache')
                   ->header('Expires', '0');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tampilkan detail pesanan berdasarkan ID
     */
    public function show($id)
    {
        try {
            $user = auth()->user();
            
            // Force fresh query from database (no caching)
            $pesanan = Pesanan::where('id', $id)
                ->where('user_id', $user->id)
                ->with(['items.produk', 'pembayaran', 'pengiriman'])
                ->first();

            if (!$pesanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            // Ensure fresh data from database
            $pesanan->refresh();
            $pesanan->load(['items.produk', 'pembayaran', 'pengiriman']);

            return response()->json([
                'success' => true,
                'data' => $pesanan
            ], 200)->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                   ->header('Pragma', 'no-cache')
                   ->header('Expires', '0');
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil detail pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Buat pesanan baru dari keranjang
     */
    public function store(Request $request)
    {
        $request->validate([
            'nama_penerima' => 'required|string|max:255',
            'alamat_pengiriman' => 'required|string',
            'nomor_telepon' => 'required|string|max:20',
            'metode_pembayaran' => 'required|string|in:bank,ewallet,cod',
            'metode_pengiriman' => 'required|string|max:255',
            'shipping_cost' => 'nullable|numeric|min:0',
            'shipping_courier_code' => 'nullable|string|max:50',
            'shipping_courier_service' => 'nullable|string|max:100',
            'tracking_number' => 'nullable|string|max:100',
        ]);

        DB::beginTransaction();
        try {
            $user = auth()->user();

            if (!$user) {
                \Log::error('PesananController store: User not authenticated');
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            \Log::info('PesananController store: User ID ' . $user->id . ' mencoba membuat pesanan');

            // Ambil keranjang user
            $keranjang = Keranjang::where('user_id', $user->id)
                ->with('items.produk')
                ->first();

            if (!$keranjang) {
                \Log::warning('PesananController store: Keranjang tidak ditemukan untuk user ' . $user->id);
                return response()->json([
                    'success' => false,
                    'message' => 'Keranjang tidak ditemukan. Silakan tambahkan produk ke keranjang terlebih dahulu.'
                ], 400);
            }

            if ($keranjang->items->isEmpty()) {
                \Log::warning('PesananController store: Keranjang kosong untuk user ' . $user->id);
                return response()->json([
                    'success' => false,
                    'message' => 'Keranjang kosong. Silakan tambahkan produk ke keranjang terlebih dahulu.'
                ], 400);
            }

            // Hitung total harga
            $totalHarga = $keranjang->items->sum(function ($item) {
                return $item->jumlah * ($item->produk->harga ?? 0);
            });

            $ongkir = (float) $request->input('shipping_cost', 0);
            $courierCode = $request->input('shipping_courier_code');
            $courierService = $request->input('shipping_courier_service');
            $trackingNumber = $request->input('tracking_number');
            $totalHarga += $ongkir;

            // Buat pesanan baru
            $pesanan = Pesanan::create([
                'user_id' => $user->id,
                'tanggal_pesanan' => now(),
                'total_harga' => $totalHarga,
                'ongkir' => $ongkir,
                'status' => 'Belum Dibayar',
                'alamat_pengiriman' => $request->alamat_pengiriman,
                'metode_pembayaran' => $request->metode_pembayaran,
                'metode_pengiriman' => $request->metode_pengiriman,
                'kurir_code' => $courierCode,
                'kurir_service' => $courierService,
                'tracking_number' => $trackingNumber,
                'nama_penerima' => $request->nama_penerima,
                'nomor_telepon' => $request->nomor_telepon,
            ]);

            // Pindahkan item dari keranjang ke item pesanan
            foreach ($keranjang->items as $item) {
                ItemPesanan::create([
                    'pesanan_id' => $pesanan->id,
                    'produk_id' => $item->produk_id,
                    'jumlah' => $item->jumlah,
                    'harga_satuan' => $item->produk->harga,
                ]);
            }

            // Kosongkan keranjang
            $keranjang->items()->delete();

            // Create notification for new order
            Notification::create([
                'user_id' => $user->id,
                'pesanan_id' => $pesanan->id,
                'title' => 'Pesanan Dibuat',
                'message' => 'Pesanan Anda telah berhasil dibuat. Silakan lakukan pembayaran.',
                'type' => 'order_created',
                'target_role' => 'customer',
                'sent_at' => now(),
            ]);

            DB::commit();

            \Log::info('PesananController store: Pesanan berhasil dibuat dengan ID ' . $pesanan->id);

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat',
                'data' => $pesanan->load('items.produk')
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('PesananController store: Error - ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update status pesanan
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Belum Dibayar,Dikemas,Dikirim,Selesai,Dibatalkan'
        ]);

        try {
            $user = auth()->user();
            
            $pesanan = Pesanan::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$pesanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            // Validasi perubahan status
            // Customer hanya bisa membatalkan pesanan yang belum dibayar
            if ($request->status === 'Dibatalkan' && $pesanan->status === 'Belum Dibayar') {
                $pesanan->update(['status' => $request->status]);
                
                // Create notification
                Notification::create([
                    'user_id' => $user->id,
                    'pesanan_id' => $pesanan->id,
                    'title' => 'Pesanan Dibatalkan',
                    'message' => 'Pesanan Anda telah dibatalkan.',
                    'type' => 'order_cancelled',
                    'target_role' => 'customer',
                    'sent_at' => now(),
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Pesanan berhasil dibatalkan',
                    'data' => $pesanan
                ], 200);
            }

            // Customer bisa konfirmasi pesanan selesai jika status Dikirim
            if ($request->status === 'Selesai' && $pesanan->status === 'Dikirim') {
                $pesanan->update(['status' => $request->status]);
                
                // Create notification
                Notification::create([
                    'user_id' => $user->id,
                    'pesanan_id' => $pesanan->id,
                    'title' => 'Pesanan Selesai',
                    'message' => 'Terima kasih! Pesanan Anda telah selesai.',
                    'type' => 'order_completed',
                    'target_role' => 'customer',
                    'sent_at' => now(),
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Pesanan selesai dikonfirmasi',
                    'data' => $pesanan
                ], 200);
            }

            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat mengubah status pesanan'
            ], 400);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Batalkan pesanan (hanya jika status Belum Dibayar)
     */
    public function cancel($id)
    {
        try {
            $user = auth()->user();
            
            $pesanan = Pesanan::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$pesanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            // Allow canceling "Belum Dibayar" and "Dikemas" orders
            if (!in_array($pesanan->status, ['Belum Dibayar', 'Dikemas'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak dapat dibatalkan'
                ], 400);
            }

            $pesanan->update(['status' => 'Dibatalkan']);
            
            // Update payment status to cancelled
            if ($pesanan->pembayaran) {
                $pesanan->pembayaran->update(['status' => 'cancelled']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibatalkan',
                'data' => $pesanan
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membatalkan pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark order as complete/received
     */
    public function complete($id)
    {
        try {
            $user = auth()->user();
            
            $pesanan = Pesanan::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$pesanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            if ($pesanan->status !== 'Dikirim') {
                return response()->json([
                    'success' => false,
                    'message' => 'Hanya pesanan dengan status "Dikirim" yang dapat diselesaikan'
                ], 400);
            }

            $pesanan->update(['status' => 'Selesai']);

            return response()->json([
                'success' => true,
                'message' => 'Pesanan telah selesai',
                'data' => $pesanan
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyelesaikan pesanan: ' . $e->getMessage()
            ], 500);
        }
    }

    public function rate(Request $request, $id)
    {
        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:1000',
            'feedback' => 'nullable|string|max:1000', // backward compatibility
        ]);

        try {
            $user = auth()->user();

            $pesanan = Pesanan::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$pesanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            if ($pesanan->status !== 'Selesai') {
                return response()->json([
                    'success' => false,
                    'message' => 'Rating hanya dapat diberikan untuk pesanan yang selesai'
                ], 400);
            }

            // Check if already rated
            if ($pesanan->rating !== null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan ini sudah pernah diberi rating'
                ], 400);
            }

            $reviewText = $validated['review'] ?? $validated['feedback'] ?? null;

            $pesanan->update([
                'rating' => $validated['rating'],
                'rating_feedback' => $reviewText,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Terima kasih atas penilaian Anda',
                'data' => $pesanan,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan rating: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Track shipment using Biteship API
     */
    public function tracking($id)
    {
        try {
            $user = auth()->user();
            
            $pesanan = Pesanan::where('id', $id)
                ->where('user_id', $user->id)
                ->first();

            if (!$pesanan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak ditemukan'
                ], 404);
            }

            if (empty($pesanan->tracking_number) || empty($pesanan->kurir_code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Nomor resi atau kurir tidak tersedia'
                ], 400);
            }

            $biteshipService = app(BiteshipService::class);
            $trackingData = $biteshipService->trackShipment(
                $pesanan->tracking_number,
                $pesanan->kurir_code
            );

            return response()->json([
                'success' => true,
                'data' => $trackingData
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal melacak pengiriman: ' . $e->getMessage()
            ], 500);
        }
    }
}
