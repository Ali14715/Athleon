<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Admin User
        User::firstOrCreate(
            ['email' => 'admin@athleon.com'],
            [
                'name' => 'Admin Athleon',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'telepon' => '081234567890',
                'jenis_kelamin' => 'L',
            ]
        );

        // Customer Users
        User::firstOrCreate(
            ['email' => 'budi@example.com'],
            [
                'name' => 'Budi Santoso',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'telepon' => '081234567891',
                'jenis_kelamin' => 'L',
            ]
        );

        User::firstOrCreate(
            ['email' => 'siti@example.com'],
            [
                'name' => 'Siti Nurhaliza',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'telepon' => '081234567892',
                'jenis_kelamin' => 'P',
            ]
        );

        User::firstOrCreate(
            ['email' => 'ahmad@example.com'],
            [
                'name' => 'Ahmad Fauzi',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'telepon' => '081234567893',
                'jenis_kelamin' => 'L',
            ]
        );

        User::firstOrCreate(
            ['email' => 'dewi@example.com'],
            [
                'name' => 'Dewi Lestari',
                'password' => Hash::make('password123'),
                'role' => 'customer',
                'telepon' => '081234567894',
                'jenis_kelamin' => 'P',
            ]
        );
    }
}
