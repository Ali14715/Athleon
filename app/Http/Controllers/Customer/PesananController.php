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

            return $this->successResponse($pesanan)
                   ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                   ->header('Pragma', 'no-cache')
                   ->header('Expires', '0');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil data pesanan: ' . $e->getMessage());
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
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            // Ensure fresh data from database
            $pesanan->refresh();
            $pesanan->load(['items.produk', 'pembayaran', 'pengiriman']);

            return $this->successResponse($pesanan)
                   ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
                   ->header('Pragma', 'no-cache')
                   ->header('Expires', '0');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil detail pesanan: ' . $e->getMessage());
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
                return $this->unauthorizedResponse('User tidak terautentikasi');
            }

            \Log::info('PesananController store: User ID ' . $user->id . ' mencoba membuat pesanan');

            // Ambil keranjang user
            $keranjang = Keranjang::where('user_id', $user->id)
                ->with('items.produk')
                ->first();

            if (!$keranjang) {
                \Log::warning('PesananController store: Keranjang tidak ditemukan untuk user ' . $user->id);
                return $this->badRequestResponse('Keranjang tidak ditemukan. Silakan tambahkan produk ke keranjang terlebih dahulu.');
            }

            if ($keranjang->items->isEmpty()) {
                \Log::warning('PesananController store: Keranjang kosong untuk user ' . $user->id);
                return $this->badRequestResponse('Keranjang kosong. Silakan tambahkan produk ke keranjang terlebih dahulu.');
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

            return $this->createdResponse($pesanan->load('items.produk'), 'Pesanan berhasil dibuat');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('PesananController store: Error - ' . $e->getMessage(), [
                'user_id' => auth()->id(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->serverErrorResponse('Gagal membuat pesanan: ' . $e->getMessage());
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
                return $this->notFoundResponse('Pesanan tidak ditemukan');
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
                
                return $this->successResponse($pesanan, 'Pesanan berhasil dibatalkan');
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
                
                return $this->successResponse($pesanan, 'Pesanan selesai dikonfirmasi');
            }

            return $this->badRequestResponse('Tidak dapat mengubah status pesanan');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengubah status: ' . $e->getMessage());
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
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            // Allow canceling "Belum Dibayar" and "Dikemas" orders
            if (!in_array($pesanan->status, ['Belum Dibayar', 'Dikemas'])) {
                return $this->badRequestResponse('Pesanan tidak dapat dibatalkan');
            }

            $pesanan->update(['status' => 'Dibatalkan']);
            
            // Update payment status to failed (cancelled order)
            if ($pesanan->pembayaran) {
                $pesanan->pembayaran->update(['status' => 'failed']);
            }

            return $this->successResponse($pesanan, 'Pesanan berhasil dibatalkan');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal membatalkan pesanan: ' . $e->getMessage());
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
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            if ($pesanan->status !== 'Dikirim') {
                return $this->badRequestResponse('Hanya pesanan dengan status "Dikirim" yang dapat diselesaikan');
            }

            $pesanan->update(['status' => 'Selesai']);

            return $this->successResponse($pesanan, 'Pesanan telah selesai');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal menyelesaikan pesanan: ' . $e->getMessage());
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
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            if ($pesanan->status !== 'Selesai') {
                return $this->badRequestResponse('Rating hanya dapat diberikan untuk pesanan yang selesai');
            }

            // Check if already rated
            if ($pesanan->rating !== null) {
                return $this->badRequestResponse('Pesanan ini sudah pernah diberi rating');
            }

            $reviewText = $validated['review'] ?? $validated['feedback'] ?? null;

            $pesanan->update([
                'rating' => $validated['rating'],
                'rating_feedback' => $reviewText,
            ]);

            return $this->successResponse($pesanan, 'Terima kasih atas penilaian Anda');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal menyimpan rating: ' . $e->getMessage());
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
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            if (empty($pesanan->tracking_number) || empty($pesanan->kurir_code)) {
                return $this->badRequestResponse('Nomor resi atau kurir tidak tersedia');
            }

            $biteshipService = app(BiteshipService::class);
            $trackingData = $biteshipService->trackShipment(
                $pesanan->tracking_number,
                $pesanan->kurir_code
            );

            return $this->successResponse($trackingData);
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal melacak pengiriman: ' . $e->getMessage());
        }
    }
}
