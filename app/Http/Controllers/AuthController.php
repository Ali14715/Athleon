<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\AlamatUser;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Mail;
use App\Models\PasswordResetOtp;
use App\Mail\ResetPasswordOtp;
use Carbon\Carbon;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;


class AuthController extends Controller
{
    // LOGIN
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $credentials = $request->only('email', 'password');

        if (!$token = auth('api')->attempt($credentials)) {
            return $this->unauthorizedResponse('Invalid credentials');
        }

        $user = auth('api')->setToken($token)->user();

        return $this->successResponse([
            'token' => $token,
            'user' => $user
        ], 'Login berhasil');
    }

    // REFRESH TOKEN
    public function refresh(Request $request)
    {
        try {
            $token = $request->bearerToken() ?? $request->query('token');

            if (!$token) {
                return $this->badRequestResponse('Token missing');
            }

            // Set the token and refresh it
            $newToken = auth('api')->setToken($token)->refresh();
            $user = auth('api')->setToken($newToken)->user();

            return $this->successResponse([
                'token' => $newToken,
                'user' => $user
            ], 'Token refreshed successfully');

        } catch (TokenExpiredException $e) {
            return $this->unauthorizedResponse('Token expired, please login again');

        } catch (TokenInvalidException $e) {
            return $this->unauthorizedResponse('Token invalid');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to refresh token: ' . $e->getMessage());
        }
    }

    // REGISTER
    public function register(Request $request)
    {
        $request->validate([
            'name'              => 'required|string|max:255',
            'email'             => 'required|email|unique:users,email',
            'telepon'           => 'required|string|max:20',
            'password'          => 'required|string|min:6|confirmed',
        ]);

        // Normalize jenis_kelamin to match database enum (L/P)
        $jenisKelamin = null;
        if ($request->jenis_kelamin) {
            $gender = strtolower($request->jenis_kelamin);
            if ($gender === 'laki-laki' || $gender === 'l') {
                $jenisKelamin = 'L';
            } elseif ($gender === 'perempuan' || $gender === 'p') {
                $jenisKelamin = 'P';
            }
        }

        $user = User::create([
            'name'          => $request->name,
            'email'         => $request->email,
            'telepon'       => $request->telepon,
            'alamat'        => $request->alamat ?? null,
            'jenis_kelamin' => $jenisKelamin,
            'password'      => bcrypt($request->password),
            'role'          => 'customer',
        ]);

        // Create default address entry only if alamat is provided
        if ($request->alamat) {
            AlamatUser::create([
                'user_id' => $user->id,
                'label' => 'Rumah',
                'nama_penerima' => $user->name,
                'telepon_penerima' => $user->telepon,
                'alamat_lengkap' => $request->alamat,
                'kota' => '-',
                'provinsi' => '-',
                'kode_pos' => '-',
                'is_default' => true,
            ]);
        }

        return $this->createdResponse($user, 'Register berhasil');
    }

    // PROFILE
    public function profile()
    {
        if (!auth()->check()) {
            return $this->unauthorizedResponse('Unauthorized');
        }

        return $this->successResponse(auth()->user(), 'Profile retrieved successfully');
    }

    // ME
    public function me(Request $request)
    {
        try {
            $token = $request->bearerToken() ?? $request->query('token');

            if (!$token) {
                return $this->badRequestResponse('Token missing');
            }

            $user = auth('api')->setToken($token)->user();

            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            return $this->successResponse($user, 'User data retrieved successfully');

        } catch (TokenExpiredException $e) {
            return $this->unauthorizedResponse('Token expired');

        } catch (TokenInvalidException $e) {
            return $this->unauthorizedResponse('Token invalid');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Server error: ' . $e->getMessage());
        }
    }

    // LOGOUT
    public function logout(Request $request)
    {
        try {
            $token = $request->bearerToken() ?? $request->query('token');

            if (!$token) {
                return $this->badRequestResponse('Token missing');
            }

            auth('api')->setToken($token)->invalidate();

            return $this->successResponse(null, 'Logout berhasil');

        } catch (TokenExpiredException $e) {
            return $this->unauthorizedResponse('Token expired');

        } catch (TokenInvalidException $e) {
            return $this->unauthorizedResponse('Token invalid');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Server error: ' . $e->getMessage());
        }
    }

    // UPDATE PROFILE
    public function updateProfile(Request $request)
    {
        try {
            $user = auth('api')->user();

            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $request->validate([
                'name'          => 'sometimes|string|max:255',
                'email'         => 'sometimes|email|unique:users,email,' . $user->id,
                'telepon'       => 'sometimes|string|max:20',
                'alamat'        => 'sometimes|string',
                'jenis_kelamin' => 'sometimes|in:L,P,laki-laki,perempuan,Laki-laki,Perempuan',
            ]);

            // Normalize jenis_kelamin to match database enum (L/P)
            $updateData = $request->only([
                'name',
                'email',
                'telepon',
                'alamat'
            ]);
            
            if ($request->has('jenis_kelamin')) {
                $gender = strtolower($request->jenis_kelamin);
                if ($gender === 'laki-laki' || $gender === 'l') {
                    $updateData['jenis_kelamin'] = 'L';
                } elseif ($gender === 'perempuan' || $gender === 'p') {
                    $updateData['jenis_kelamin'] = 'P';
                }
            }

            $user->update($updateData);

            return $this->successResponse($user, 'Profil berhasil diperbarui');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal memperbarui profil: ' . $e->getMessage());
        }
    }
    
    /**
     * Change Password (for authenticated users)
     */
    public function changePassword(Request $request)
    {
        try {
            $user = auth('api')->user();

            if (!$user) {
                return $this->unauthorizedResponse('Unauthorized');
            }

            $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6|confirmed',
            ]);

            // Check if current password is correct
            if (!Hash::check($request->current_password, $user->password)) {
                return $this->badRequestResponse('Password lama tidak sesuai');
            }

            // Update password
            $user->update([
                'password' => bcrypt($request->new_password)
            ]);

            return $this->successResponse(null, 'Password berhasil diubah');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Gagal mengubah password: ' . $e->getMessage());
        }
    }

    /**
     * Send OTP to email for password reset
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        // Check if user exists
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return $this->notFoundResponse('Email tidak terdaftar');
        }

        // Delete old OTPs for this email
        PasswordResetOtp::where('email', $request->email)->delete();

        // Generate 6-digit OTP
        $otp = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiryMinutes = 10;

        // Save OTP to database
        PasswordResetOtp::create([
            'email' => $request->email,
            'otp' => $otp,
            'expires_at' => Carbon::now()->addMinutes($expiryMinutes),
        ]);

        // Send OTP via email
        try {
            Mail::to($request->email)->send(new ResetPasswordOtp($otp, $expiryMinutes));

            return $this->successResponse([
                'expires_in' => $expiryMinutes * 60
            ], 'Kode OTP telah dikirim ke email Anda');
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            return $this->serverErrorResponse('Gagal mengirim email. Silakan coba lagi.');
        }
    }

    /**
     * Verify OTP code
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
        ]);

        $otpRecord = PasswordResetOtp::where('email', $request->email)
            ->where('otp', $request->otp)
            ->where('is_used', false)
            ->first();

        if (!$otpRecord) {
            return $this->badRequestResponse('Kode OTP tidak valid');
        }

        if (!$otpRecord->isValid()) {
            return $this->badRequestResponse('Kode OTP sudah kadaluarsa');
        }

        return $this->successResponse(null, 'Kode OTP valid');
    }

    /**
     * Reset password with OTP verification
     */
    public function resetPasswordWithOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ]);

        // Verify OTP
        $otpRecord = PasswordResetOtp::where('email', $request->email)
            ->where('otp', $request->otp)
            ->where('is_used', false)
            ->first();

        if (!$otpRecord || !$otpRecord->isValid()) {
            return $this->badRequestResponse('Kode OTP tidak valid atau sudah kadaluarsa');
        }

        // Find user
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return $this->notFoundResponse('User tidak ditemukan');
        }

        // Update password
        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->setRememberToken(Str::random(60));
        $user->save();

        // Mark OTP as used
        $otpRecord->markAsUsed();

        // Fire password reset event
        event(new PasswordReset($user));

        return $this->successResponse(null, 'Password berhasil direset. Silakan login dengan password baru Anda.');
    }
}
