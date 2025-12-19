<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $fillable = [
        'title',
        'description',
        'image_url',
        'link_url',
        'button_text',
        'is_active',
        'order',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function getImageUrlAttribute($value)
    {
        if (!$value) {
            return null;
        }

        // If already an absolute URL, return as is
        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        // Remove storage/ prefix if exists (from seeder data)
        $path = $value;
        if (str_starts_with($path, 'storage/')) {
            $path = substr($path, 8); // Remove 'storage/'
        }
        
        // Convert to absolute URL: /storage/path
        return url('storage/' . ltrim($path, '/'));
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->orderBy('order');
    }
}
