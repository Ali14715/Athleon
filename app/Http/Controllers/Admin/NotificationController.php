<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Pembayaran;
use App\Models\Pesanan;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min((int) $request->get('per_page', 20), 100));
        $status = $request->get('status');
        $targetRole = $request->get('target_role');
        $userId = $request->get('user_id');

        $query = Notification::with([
            'user:id,name,email,role',
            'pesanan:id,user_id,status,total_harga',
            'pembayaran:id,pesanan_id,status,jumlah_bayar',
        ])->orderByDesc('created_at');

        if ($status === 'unread') {
            $query->whereNull('read_at');
        }

        if ($targetRole) {
            $query->where('target_role', $targetRole);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        $notifications = $query->paginate($perPage);

        return $this->paginatedResponse($notifications, 'Notifications retrieved successfully');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'target_role' => 'required|in:customer,admin',
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|string|max:50',
            'pesanan_id' => 'nullable|exists:pesanan,id',
            'pembayaran_id' => 'nullable|exists:pembayaran,id',
            'data' => 'nullable|array',
            'mark_as_read' => 'nullable|boolean',
        ]);

        if ($validated['target_role'] === 'customer' && empty($validated['user_id'])) {
            throw ValidationException::withMessages([
                'user_id' => ['User ID diperlukan untuk notifikasi customer'],
            ]);
        }

        $userId = $validated['user_id'] ?? $request->user()->id;

        $this->assertLinkedRecords($userId, $validated, $validated['target_role']);

        $notification = Notification::create([
            'user_id' => $userId,
            'pesanan_id' => $validated['pesanan_id'] ?? null,
            'pembayaran_id' => $validated['pembayaran_id'] ?? null,
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'] ?? 'general',
            'target_role' => $validated['target_role'],
            'data' => $validated['data'] ?? null,
            'sent_at' => now(),
            'read_at' => !empty($validated['mark_as_read']) ? now() : null,
        ]);

        return $this->createdResponse(
            $notification->load(['user', 'pesanan', 'pembayaran']),
            'Notifikasi berhasil dibuat'
        );
    }

    public function markAsRead(Notification $notification)
    {
        if ($notification->read_at) {
            return $this->successResponse(null, 'Notifikasi sudah dibaca');
        }

        $notification->markAsRead();

        return $this->successResponse(null, 'Notifikasi ditandai sebagai dibaca');
    }

    public function markAllRead(Request $request)
    {
        $targetRole = $request->get('target_role', 'admin');
        $userId = $request->get('user_id');

        if ($targetRole === 'admin' && !$userId) {
            $userId = $request->user()->id;
        }

        if ($targetRole === 'customer' && !$userId) {
            throw ValidationException::withMessages([
                'user_id' => ['User ID diperlukan untuk menandai notifikasi customer'],
            ]);
        }

        $query = Notification::where('target_role', $targetRole)->whereNull('read_at');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        $query->update(['read_at' => now()]);

        return $this->successResponse(null, 'Notifikasi ditandai sebagai dibaca');
    }

    private function assertLinkedRecords(int $userId, array $payload, string $targetRole): void
    {
        if ($targetRole !== 'customer') {
            return;
        }

        if (!empty($payload['pesanan_id'])) {
            $orderOwned = Pesanan::where('id', $payload['pesanan_id'])
                ->where('user_id', $userId)
                ->exists();

            if (!$orderOwned) {
                throw ValidationException::withMessages([
                    'pesanan_id' => ['Pesanan tidak valid untuk user ini'],
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
                    'pembayaran_id' => ['Pembayaran tidak valid untuk user ini'],
                ]);
            }
        }
    }
}
