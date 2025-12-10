<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pesanan;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PesananController extends Controller
{
    /**
     * Tampilkan semua pesanan (Admin)
     */
    public function index(Request $request)
    {
        try {
            $perPage = (int) $request->get('per_page', 20);
            $perPage = max(1, min($perPage, 100));
            $search = $request->get('search');

            $query = Pesanan::with(['user', 'items.produk'])
                ->orderByDesc('created_at');

            if ($search) {
                $query->where(function ($builder) use ($search) {
                    $builder->where('id', (int) $search)
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($userQuery) use ($search) {
                            $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });
                });
            }

            $pesanan = $query->paginate($perPage);

            $data = $pesanan->getCollection()->map(function (Pesanan $order) {
                $items = $order->items->map(function ($item) {
                    // Use the price in this order: harga_varian > harga_satuan > produk->harga
                    $pricePerUnit = $item->harga_varian ?? $item->harga_satuan ?? optional($item->produk)->harga ?? 0;
                    $calculatedSubtotal = $item->jumlah * $pricePerUnit;
                    
                    return [
                        'id' => $item->id,
                        'jumlah' => $item->jumlah,
                        'harga_satuan' => $item->harga_satuan ?? optional($item->produk)->harga ?? 0,
                        'harga_varian' => $item->harga_varian ?? null,
                        'varian_label' => $item->varian_label,
                        'varians' => $item->varians ?? [],
                        'subtotal' => $item->subtotal ?? $calculatedSubtotal,
                        'produk' => [
                            'id' => optional($item->produk)->id,
                            'nama' => optional($item->produk)->nama,
                            'harga' => optional($item->produk)->harga,
                            'gambar_url' => optional($item->produk)->gambar_url,
                        ],
                    ];
                })->values();

                return [
                    'id' => $order->id,
                    'status' => $order->status,
                    'total' => $order->total_harga ?? 0,
                    'created_at' => optional($order->created_at)->toISOString(),
                    'tracking_number' => $order->tracking_number,
                    'user' => [
                        'id' => optional($order->user)->id,
                        'name' => optional($order->user)->name,
                        'email' => optional($order->user)->email,
                    ],
                    'itemPesanan' => $items,
                ];
            })->values();

            return $this->successResponse([
                'data' => $data,
                'pagination' => [
                    'total' => $pesanan->total(),
                    'per_page' => $pesanan->perPage(),
                    'current_page' => $pesanan->currentPage(),
                    'last_page' => $pesanan->lastPage(),
                    'from' => $pesanan->firstItem(),
                    'to' => $pesanan->lastItem(),
                ],
            ], 'Pesanan retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil data pesanan: ' . $e->getMessage());
        }
    }

    /**
     * Tampilkan detail pesanan
     */
    public function show($id)
    {
        try {
            $pesanan = Pesanan::with(['user', 'items.produk', 'pembayaran', 'pengiriman'])
                ->find($id);

            if (!$pesanan) {
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            // Format items with proper pricing
            $formattedItems = $pesanan->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'jumlah' => $item->jumlah,
                    'harga_satuan' => $item->harga_satuan ?? 0,
                    'harga_varian' => $item->harga_varian ?? 0,
                    'varian_label' => $item->varian_label,
                    'varians' => $item->varians ?? [],
                    'subtotal' => $item->subtotal,
                    'produk' => [
                        'id' => optional($item->produk)->id,
                        'nama' => optional($item->produk)->nama,
                        'harga' => optional($item->produk)->harga,
                    ],
                ];
            });

            // Format response with all necessary fields
            $response = [
                'id' => $pesanan->id,
                'user_id' => $pesanan->user_id,
                'tanggal_pesanan' => $pesanan->tanggal_pesanan,
                'total_harga' => $pesanan->total_harga,
                'total' => $pesanan->total_harga,
                'ongkir' => $pesanan->ongkir ?? 0,
                'status' => $pesanan->status,
                'rating' => $pesanan->rating,
                'rating_feedback' => $pesanan->rating_feedback,
                'alamat_pengiriman' => $pesanan->alamat_pengiriman,
                'metode_pembayaran' => $pesanan->metode_pembayaran,
                'metode_pengiriman' => $pesanan->metode_pengiriman,
                'kurir_code' => $pesanan->kurir_code,
                'kurir_service' => $pesanan->kurir_service,
                'tracking_number' => $pesanan->tracking_number,
                'nama_penerima' => $pesanan->nama_penerima,
                'nomor_telepon' => $pesanan->nomor_telepon,
                'created_at' => $pesanan->created_at,
                'updated_at' => $pesanan->updated_at,
                'user' => $pesanan->user,
                'itemPesanan' => $formattedItems,
                'pembayaran' => $pesanan->pembayaran,
                'pengiriman' => $pesanan->pengiriman,
            ];

            return $this->successResponse($response, 'Detail pesanan retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil detail pesanan: ' . $e->getMessage());
        }
    }

    /**
     * Update status pesanan (Admin)
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Belum Dibayar,Sudah Dibayar,Dikemas,Dikirim,Selesai,Dibatalkan'
        ]);

        DB::beginTransaction();
        try {
            $pesanan = Pesanan::with('items.produk')->find($id);

            if (!$pesanan) {
                DB::rollBack();
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            $oldStatus = $pesanan->status;
            $newStatus = $request->status;
            
            // Decrease stock when order is packed/shipped/completed (only once)
            // Stock should be decreased when order moves to "Dikemas" status
            if ($newStatus === 'Dikemas' && $oldStatus !== 'Dikemas') {
                foreach ($pesanan->items as $item) {
                    if ($item->produk) {
                        $currentStock = $item->produk->stok ?? 0;
                        $newStock = $currentStock - $item->jumlah;
                        
                        // Check if stock is sufficient
                        if ($newStock < 0) {
                            DB::rollBack();
                            return $this->badRequestResponse("Stok tidak mencukupi untuk produk: {$item->produk->nama}. Stok tersedia: {$currentStock}, diperlukan: {$item->jumlah}");
                        }
                        
                        // Update product stock
                        $item->produk->update(['stok' => $newStock]);
                        \Log::info("Stock decreased for product #{$item->produk->id} ({$item->produk->nama}): {$currentStock} -> {$newStock}");
                    }
                }
                
                // Update status
                $pesanan->update(['status' => $newStatus]);
            } else {
                // For other status changes, just update the status
                $pesanan->update(['status' => $newStatus]);
            }

            // Restore stock if order is cancelled
            if ($newStatus === 'Dibatalkan' && $oldStatus === 'Dikemas') {
                foreach ($pesanan->items as $item) {
                    if ($item->produk) {
                        $currentStock = $item->produk->stok ?? 0;
                        $newStock = $currentStock + $item->jumlah;
                        $item->produk->update(['stok' => $newStock]);
                        \Log::info("Stock restored for product #{$item->produk->id} ({$item->produk->nama}): {$currentStock} -> {$newStock}");
                    }
                }
            }

            // Create notification for status change
            if ($oldStatus !== $newStatus) {
                $notificationMessages = [
                    'Belum Dibayar' => 'Pesanan Anda menunggu pembayaran.',
                    'Sudah Dibayar' => 'Pembayaran Anda telah dikonfirmasi.',
                    'Dikemas' => 'Pesanan Anda sedang dikemas dan akan segera dikirim.',
                    'Dikirim' => 'Pesanan Anda sedang dalam pengiriman.',
                    'Selesai' => 'Pesanan Anda telah selesai. Terima kasih!',
                    'Dibatalkan' => 'Pesanan Anda telah dibatalkan.',
                ];

                $notificationTypes = [
                    'Belum Dibayar' => 'order_pending_payment',
                    'Sudah Dibayar' => 'order_paid',
                    'Dikemas' => 'order_packed',
                    'Dikirim' => 'order_shipped',
                    'Selesai' => 'order_delivered',
                    'Dibatalkan' => 'order_cancelled',
                ];

                Notification::create([
                    'user_id' => $pesanan->user_id,
                    'pesanan_id' => $pesanan->id,
                    'title' => 'Status Pesanan Diubah: ' . $newStatus,
                    'message' => $notificationMessages[$newStatus] ?? 'Status pesanan Anda telah diubah.',
                    'type' => $notificationTypes[$newStatus] ?? 'order_status_changed',
                    'target_role' => 'customer',
                    'sent_at' => now(),
                ]);
            }

            DB::commit();

            return $this->successResponse($pesanan->fresh(), 'Status pesanan berhasil diubah');
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating order status: ' . $e->getMessage());
            return $this->serverErrorResponse('Gagal mengubah status: ' . $e->getMessage());
        }
    }

    /**
     * Update status pesanan menjadi Dikemas (setelah pembayaran dikonfirmasi)
     */
    public function markAsPacked($id)
    {
        try {
            $pesanan = Pesanan::find($id);

            if (!$pesanan) {
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            if ($pesanan->status !== 'Belum Dibayar') {
                return $this->badRequestResponse('Pesanan harus berstatus "Belum Dibayar"');
            }

            $pesanan->update(['status' => 'Dikemas']);

            // Create notification
            Notification::create([
                'user_id' => $pesanan->user_id,
                'pesanan_id' => $pesanan->id,
                'title' => 'Pesanan Sedang Dikemas',
                'message' => 'Pesanan Anda sedang dikemas dan akan segera dikirim.',
                'type' => 'order_packed',
                'target_role' => 'customer',
                'sent_at' => now(),
            ]);

            return $this->successResponse($pesanan, 'Pesanan dikemas');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengubah status: ' . $e->getMessage());
        }
    }

    /**
     * Update status pesanan menjadi Dikirim
     */
    public function markAsShipped($id)
    {
        try {
            $pesanan = Pesanan::find($id);

            if (!$pesanan) {
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            if ($pesanan->status !== 'Dikemas') {
                return $this->badRequestResponse('Pesanan harus berstatus "Dikemas"');
            }

            $pesanan->update(['status' => 'Dikirim']);

            // Create notification
            Notification::create([
                'user_id' => $pesanan->user_id,
                'pesanan_id' => $pesanan->id,
                'title' => 'Pesanan Sedang Dikirim',
                'message' => 'Pesanan Anda sedang dalam pengiriman. Tracking: ' . ($pesanan->tracking_number ?? '-'),
                'type' => 'order_shipped',
                'target_role' => 'customer',
                'sent_at' => now(),
            ]);

            return $this->successResponse($pesanan, 'Pesanan dikirim');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengubah status: ' . $e->getMessage());
        }
    }

    /**
     * Update status pesanan menjadi Selesai
     */
    public function markAsCompleted($id)
    {
        try {
            $pesanan = Pesanan::find($id);

            if (!$pesanan) {
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            if ($pesanan->status !== 'Dikirim') {
                return $this->badRequestResponse('Pesanan harus berstatus "Dikirim"');
            }

            $pesanan->update(['status' => 'Selesai']);

            return $this->successResponse($pesanan, 'Pesanan selesai');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengubah status: ' . $e->getMessage());
        }
    }

    /**
     * Batalkan pesanan
     */
    public function cancel($id)
    {
        try {
            $pesanan = Pesanan::find($id);

            if (!$pesanan) {
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            $pesanan->update(['status' => 'Dibatalkan']);
            
            // Update payment status to failed (cancelled order)
            if ($pesanan->pembayaran) {
                $pesanan->pembayaran->update(['status' => 'failed']);
            }

            return $this->successResponse($pesanan, 'Pesanan dibatalkan');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal membatalkan pesanan: ' . $e->getMessage());
        }
    }

    /**
     * Update tracking number
     */
    public function updateTracking(Request $request, $id)
    {
        $request->validate([
            'tracking_number' => 'required|string|max:100'
        ]);

        try {
            $pesanan = Pesanan::find($id);

            if (!$pesanan) {
                return $this->notFoundResponse('Pesanan tidak ditemukan');
            }

            $pesanan->update(['tracking_number' => $request->tracking_number]);

            return $this->successResponse($pesanan, 'Nomor resi berhasil diupdate');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengupdate nomor resi: ' . $e->getMessage());
        }
    }
}
