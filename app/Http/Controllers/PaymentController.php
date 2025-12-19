<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pesanan;
use App\Models\Pembayaran;
use App\Models\Notification as UserNotification;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

class PaymentController extends Controller
{
    public function __construct()
    {
        // Set Midtrans configuration based on services config
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production', false);
        Config::$isSanitized = config('services.midtrans.is_sanitized', true);
        Config::$is3ds = config('services.midtrans.is_3ds', true);
    }

    /**
     * Create Snap Token for Midtrans Payment
     */
    public function createSnapToken(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|exists:pesanan,id',
            ]);

            $pesanan = Pesanan::with(['user', 'items.produk'])->findOrFail($request->order_id);

            // Check if order belongs to authenticated user (cast to int to avoid strict type mismatch)
            if ((int) $pesanan->user_id !== (int) auth()->id()) {
                return $this->forbiddenResponse('Unauthorized access to this order');
            }

            // Check if order already paid
            $pembayaran = Pembayaran::firstOrNew(['pesanan_id' => $pesanan->id]);
            if ($pembayaran->exists && $pembayaran->status === 'paid') {
                return $this->badRequestResponse('Order already paid');
            }

            // Prepare transaction details
            $transactionDetails = [
                'order_id' => 'ATHLEON-' . $pesanan->id . '-' . time(),
                'gross_amount' => (int) $pesanan->total_harga,
            ];

            // Prepare item details
            $itemDetails = [];
            foreach ($pesanan->items as $item) {
                $unitPrice = $item->harga_varian > 0 ? $item->harga_varian : ($item->harga_satuan ?? 0);
                $itemDetails[] = [
                    'id' => $item->produk_id,
                    'price' => (int) $unitPrice,
                    'quantity' => $item->jumlah,
                    'name' => optional($item->produk)->nama ?? 'Produk ' . $item->produk_id,
                ];
            }

            if ($pesanan->ongkir > 0) {
                $itemDetails[] = [
                    'id' => 'SHIPPING',
                    'price' => (int) $pesanan->ongkir,
                    'quantity' => 1,
                    'name' => 'Ongkos Kirim',
                ];
            }

            // Customer details
            $customerDetails = [
                'first_name' => $pesanan->nama_penerima,
                'email' => $pesanan->user->email,
                'phone' => $pesanan->nomor_telepon,
            ];

            // Transaction data
            $transactionData = [
                'transaction_details' => $transactionDetails,
                'item_details' => $itemDetails,
                'customer_details' => $customerDetails,
            ];

            // Get Snap Token
            $snapToken = Snap::getSnapToken($transactionData);

            $pembayaran->fill([
                'metode' => 'midtrans',
                'jumlah_bayar' => $pesanan->total_harga,
                'status' => 'pending',
                'snap_token' => $snapToken,
                'transaction_id' => $transactionDetails['order_id'],
            ]);
            $pembayaran->save();

            return $this->successResponse([
                'snap_token' => $snapToken,
                'order_id' => $pesanan->id,
            ], 'Snap token created successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create payment: ' . $e->getMessage());
        }
    }

    /**
     * Handle Midtrans Notification Callback
     */
    public function handleNotification(Request $request)
    {
        try {
            $notification = new Notification();

            $transactionStatus = $notification->transaction_status;
            $fraudStatus = $notification->fraud_status;
            $orderId = $notification->order_id; // Format: ATHLEON-{id}-{timestamp}

            $parts = explode('-', $orderId);
            $pesananId = isset($parts[1]) ? (int) $parts[1] : null;

            $pembayaran = Pembayaran::where('transaction_id', $orderId)->first();
            if (!$pembayaran && $pesananId) {
                $pembayaran = Pembayaran::where('pesanan_id', $pesananId)->first();
            }

            $pesanan = $pesananId ? Pesanan::find($pesananId) : null;

            if (!$pembayaran || !$pesanan) {
                return $this->notFoundResponse('Payment or Order not found');
            }

            if ($transactionStatus === 'capture') {
                if ($fraudStatus === 'accept') {
                    $pembayaran->status = 'paid';
                    $pembayaran->tanggal_bayar = now();
                    $pesanan->status = 'Sudah Dibayar';
                    $this->createNotification($pesanan, 'Pembayaran Berhasil', 'Pembayaran Anda telah dikonfirmasi. Pesanan sedang diproses.', 'payment_success');
                } else {
                    $pembayaran->status = 'pending';
                }
            } elseif ($transactionStatus === 'settlement') {
                $pembayaran->status = 'paid';
                $pembayaran->tanggal_bayar = now();
                $pesanan->status = 'Sudah Dibayar';
                $this->createNotification($pesanan, 'Pembayaran Berhasil', 'Pembayaran Anda telah dikonfirmasi. Pesanan sedang diproses.', 'payment_success');
            } elseif ($transactionStatus === 'pending') {
                $pembayaran->status = 'pending';
                $pesanan->status = 'Belum Dibayar';
                $this->createNotification($pesanan, 'Menunggu Pembayaran', 'Pesanan Anda menunggu pembayaran. Silakan selesaikan pembayaran.', 'payment_pending');
            } elseif (in_array($transactionStatus, ['deny', 'cancel'], true)) {
                $pembayaran->status = 'failed';
                $pesanan->status = 'Dibatalkan';
                $this->createNotification($pesanan, 'Pembayaran Gagal', 'Pembayaran Anda gagal atau dibatalkan.', 'payment_failed');
            } elseif ($transactionStatus === 'expire') {
                $pembayaran->status = 'expired';
                $pesanan->status = 'Dibatalkan';
                $this->createNotification($pesanan, 'Pembayaran Kedaluwarsa', 'Pembayaran Anda telah kedaluwarsa. Silakan buat pesanan baru.', 'payment_expired');
            }

            $pembayaran->save();
            $pesanan->save();

            return $this->successResponse(null, 'Notification handled successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to handle notification: ' . $e->getMessage());
        }
    }

    /**
     * Check Payment Status from Midtrans
     */
    public function checkStatus(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|exists:pesanan,id',
            ]);

            $pesanan = Pesanan::findOrFail($request->order_id);

            // Check if order belongs to authenticated user (cast to int to avoid strict type mismatch)
            if ((int) $pesanan->user_id !== (int) auth()->id()) {
                return $this->forbiddenResponse('Unauthorized access to this order');
            }

            $pembayaran = Pembayaran::where('pesanan_id', $pesanan->id)->first();

            if (!$pembayaran) {
                return $this->notFoundResponse('Payment not found');
            }

            // Check status from Midtrans if transaction_id exists
            if ($pembayaran->transaction_id) {
                try {
                    $status = \Midtrans\Transaction::status($pembayaran->transaction_id);
                    
                    // Update local status based on Midtrans response
                    $transactionStatus = $status->transaction_status;
                    $fraudStatus = $status->fraud_status ?? 'accept';
                    
                    $oldPaymentStatus = $pembayaran->status;
                    $oldOrderStatus = $pesanan->status;
                    $statusChanged = false;
                    
                    if ($transactionStatus === 'capture') {
                        if ($fraudStatus === 'accept') {
                            $pembayaran->status = 'paid';
                            $pembayaran->tanggal_bayar = $pembayaran->tanggal_bayar ?? now();
                            $pesanan->status = 'Dikemas';
                            
                            // Decrease stock when payment is successful
                            if ($oldOrderStatus !== 'Dikemas') {
                                $this->decreaseStock($pesanan);
                            }
                            
                            $statusChanged = true;
                        }
                    } elseif ($transactionStatus === 'settlement') {
                        $pembayaran->status = 'paid';
                        $pembayaran->tanggal_bayar = $pembayaran->tanggal_bayar ?? now();
                        $pesanan->status = 'Dikemas';
                        
                        // Decrease stock when payment is successful
                        if ($oldOrderStatus !== 'Dikemas') {
                            $this->decreaseStock($pesanan);
                        }
                        
                        $statusChanged = true;
                    } elseif ($transactionStatus === 'pending') {
                        $pembayaran->status = 'pending';
                        if ($pesanan->status === 'Belum Dibayar') {
                            // Keep as Belum Dibayar
                        }
                    } elseif (in_array($transactionStatus, ['deny', 'cancel'], true)) {
                        $pembayaran->status = 'failed';
                        $pesanan->status = 'Dibatalkan';
                        $statusChanged = true;
                    } elseif ($transactionStatus === 'expire') {
                        $pembayaran->status = 'expired';
                        $pesanan->status = 'Dibatalkan';
                        $statusChanged = true;
                    }
                    
                    // Save if either payment or order status changed
                    if ($oldPaymentStatus !== $pembayaran->status || $oldOrderStatus !== $pesanan->status || $statusChanged) {
                        $pembayaran->save();
                        $pesanan->save();
                        
                        \Log::info('Payment status updated', [
                            'order_id' => $pesanan->id,
                            'old_payment_status' => $oldPaymentStatus,
                            'new_payment_status' => $pembayaran->status,
                            'old_order_status' => $oldOrderStatus,
                            'new_order_status' => $pesanan->status,
                            'midtrans_status' => $transactionStatus
                        ]);
                    }
                } catch (\Exception $e) {
                    // If Midtrans check fails, continue with local data
                    \Log::warning('Failed to check Midtrans status: ' . $e->getMessage());
                }
            }

            return $this->successResponse([
                'order_id' => $pesanan->id,
                'order_status' => $pesanan->status,
                'payment_status' => $pembayaran->status,
                'payment_method' => $pembayaran->metode,
                'amount' => $pembayaran->jumlah_bayar,
                'paid_at' => $pembayaran->tanggal_bayar,
            ], 'Payment status retrieved successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to check status: ' . $e->getMessage());
        }
    }

    /**
     * Decrease product stock when order is paid
     */
    private function decreaseStock($pesanan)
    {
        \DB::beginTransaction();
        try {
            $pesanan->load('items.produk');
            
            foreach ($pesanan->items as $item) {
                if ($item->produk) {
                    $currentStock = $item->produk->stok ?? 0;
                    $newStock = $currentStock - $item->jumlah;
                    
                    if ($newStock < 0) {
                        \Log::warning("Stock insufficient for product #{$item->produk->id} ({$item->produk->nama}). Available: {$currentStock}, Required: {$item->jumlah}");
                        // Continue anyway since payment is already successful
                        $newStock = 0;
                    }
                    
                    $item->produk->update(['stok' => $newStock]);
                    \Log::info("Stock decreased for product #{$item->produk->id} ({$item->produk->nama}): {$currentStock} -> {$newStock}");
                }
            }
            
            \DB::commit();
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error("Failed to decrease stock for order #{$pesanan->id}: " . $e->getMessage());
        }
    }

    /**
     * Create notification for order status change
     */
    private function createNotification(Pesanan $pesanan, string $title, string $message, string $type): void
    {
        UserNotification::create([
            'user_id' => $pesanan->user_id,
            'pesanan_id' => $pesanan->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'target_role' => 'customer',
            'sent_at' => now(),
        ]);
    }
}
