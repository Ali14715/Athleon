<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Keranjang extends Model
{
    protected $table = 'keranjang';
    protected $fillable = ['user_id', 'total_harga'];

    public function items()
    {
        return $this->hasMany(ItemKeranjang::class, 'keranjang_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
