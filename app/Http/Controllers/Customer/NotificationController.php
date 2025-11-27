<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Pesanan;
use App\Models\Pembayaran;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if (!$user) {
            return $this->unauthorizedResponse('Unauthorized');
        }
        
        $perPage = max(1, min((int) $request->get('per_page', 20), 100));
        $status = $request->get('status');

        $query = Notification::with(['pesanan:id,user_id,status,total_harga', 'pembayaran:id,pesanan_id,status,jumlah_bayar'])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($status === 'unread') {
            $query->whereNull('read_at');
        }

        $notifications = $query->paginate($perPage);
        $unreadCount = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return $this->customResponse(200, 'Notifikasi berhasil diambil', [
            'notifications' => $notifications->items(),
            'pagination' => [
                'total' => $notifications->total(),
                'per_page' => $notifications->perPage(),
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
            ],
            'meta' => [
                'unread_count' => $unreadCount,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|string|max:50',
            'pesanan_id' => 'nullable|exists:pesanan,id',
            'pembayaran_id' => 'nullable|exists:pembayaran,id',
            'data' => 'nullable|array',
        ]);

        $this->assertUserOwnsLinkedRecords($user->id, $validated);

        $notification = Notification::create([
            'user_id' => $user->id,
            'pesanan_id' => $validated['pesanan_id'] ?? null,
            'pembayaran_id' => $validated['pembayaran_id'] ?? null,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'] ?? 'general',
            'data' => $validated['data'] ?? null,
            'sent_at' => now(),
        ]);

        return $this->createdResponse($notification->load(['pesanan', 'pembayaran']), 'Notifikasi berhasil dibuat');
    }

    public function markAsRead(Notification $notification)
    {
        $user = auth()->user();

        if ($notification->user_id !== $user->id) {
            return $this->notFoundResponse('Notifikasi tidak ditemukan');
        }

        $notification->markAsRead();
        $unreadCount = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return $this->successResponse(['unread_count' => $unreadCount], 'Notifikasi ditandai sebagai dibaca');
    }

    public function markAllRead(Request $request)
    {
        $user = $request->user();

        Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $unreadCount = Notification::where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();

        return $this->successResponse(['unread_count' => $unreadCount], 'Semua notifikasi ditandai sebagai dibaca');
    }

    private function assertUserOwnsLinkedRecords(int $userId, array $payload): void
    {
        if (!empty($payload['pesanan_id'])) {
            $orderOwned = Pesanan::where('id', $payload['pesanan_id'])
                ->where('user_id', $userId)
                ->exists();

            if (!$orderOwned) {
                throw ValidationException::withMessages([
                    'pesanan_id' => ['Pesanan tidak valid untuk pengguna ini'],
                ]);
            }
        }

        if (!empty($payload['pembayaran_id'])) {
            $paymentOwned = Pembayaran::where('id', $payload['pembayaran_id'])
                ->whereHas('pesanan', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->exists();

            if (!$paymentOwned) {
                throw ValidationException::withMessages([
                    'pembayaran_id' => ['Pembayaran tidak valid untuk pengguna ini'],
                ]);
            }
        }
    }
}
