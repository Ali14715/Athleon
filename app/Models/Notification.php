<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pesanan_id',
        'pembayaran_id',
        'title',
        'message',
        'type',
        'target_role',
        'data',
        'sent_at',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pesanan(): BelongsTo
    {
        return $this->belongsTo(Pesanan::class);
    }

    public function pembayaran(): BelongsTo
    {
        return $this->belongsTo(Pembayaran::class);
    }

    public function scopeForRole($query, string $role)
    {
        return $query->where('target_role', $role);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function markAsRead(): void
    {
        if (!$this->read_at) {
            $this->forceFill(['read_at' => now()])->save();
        }
    }
}
