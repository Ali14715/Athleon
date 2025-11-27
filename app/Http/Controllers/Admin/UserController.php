<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Get all users with pagination and filters
     */
    public function index(Request $request)
    {
        try {
            $query = User::query();

            // Search by name or email
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Filter by role
            if ($request->has('role') && $request->role) {
                $query->where('role', $request->role);
            }

            // Sort
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $request->get('per_page', 15);
            $users = $query->paginate($perPage);

            return $this->paginatedResponse($users, 'Users retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil data pengguna: ' . $e->getMessage());
        }
    }

    /**
     * Get single user details
     */
    public function show($id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return $this->notFoundResponse('Pengguna tidak ditemukan');
            }

            return $this->successResponse($user, 'User retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengambil data pengguna: ' . $e->getMessage());
        }
    }

    /**
     * Update user (role, status, etc.)
     */
    public function update(Request $request, $id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return $this->notFoundResponse('Pengguna tidak ditemukan');
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|email|unique:users,email,' . $id,
                'role' => 'sometimes|in:admin,customer',
                'password' => 'sometimes|string|min:6',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse('Validasi gagal', $validator->errors());
            }

            // Update fields
            if ($request->has('name')) {
                $user->name = $request->name;
            }

            if ($request->has('email')) {
                $user->email = $request->email;
            }

            if ($request->has('role')) {
                $user->role = $request->role;
            }

            if ($request->has('password')) {
                $user->password = Hash::make($request->password);
            }

            $user->save();

            return $this->successResponse($user, 'Pengguna berhasil diperbarui');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal memperbarui pengguna: ' . $e->getMessage());
        }
    }

    /**
     * Delete user
     */
    public function destroy($id)
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return $this->notFoundResponse('Pengguna tidak ditemukan');
            }

            // Prevent deleting yourself
            if ($user->id === auth()->id()) {
                return $this->badRequestResponse('Anda tidak dapat menghapus akun Anda sendiri');
            }

            $user->delete();

            return $this->successResponse(null, 'Pengguna berhasil dihapus');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal menghapus pengguna: ' . $e->getMessage());
        }
    }
}
