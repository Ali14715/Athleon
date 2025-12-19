<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
 use Illuminate\Foundation\Auth\User as Authenticatable;
 use Illuminate\Notifications\Notifiable;
 use Illuminate\Database\Eloquent\Relations\HasMany;
 use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    /**
     * Kolom yang boleh diisi massal
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',          // admin / customer
        'telepon',
        'jenis_kelamin',
    ];

    /**
     * Kolom yang disembunyikan dari output JSON
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Tipe data otomatis untuk beberapa kolom
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * JWT: ambil primary key user (ID)
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * JWT: klaim tambahan (kosongkan kalau tidak perlu)
     */
    public function getJWTCustomClaims()
    {
        return [];
    }

    /**
     * Relationship: User has many addresses
     */
    public function alamat()
    {
        return $this->hasMany(AlamatUser::class);
    }

    /**
     * Relationship: User has many wishlist items
     */
    public function wishlist()
    {
        return $this->hasMany(Wishlist::class);
    }

    /**
     * Relationship: User has many notifications
     */
    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
