<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AlamatUser extends Model
{
    use HasFactory;

    protected $table = 'alamat_user';

    protected $fillable = [
        'user_id',
        'label',
        'nama_penerima',
        'telepon_penerima',
        'alamat_lengkap',
        'provinsi',
        'kota',
        'kecamatan',
        'kelurahan',
        'kode_pos',
        'area_id',
        'latitude',
        'longitude',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}