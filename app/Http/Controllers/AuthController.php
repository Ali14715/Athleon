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
            return response()->json([
                'success' => false,
                'message' => '401 Invalid Credentials'
            ], 401);
        }

        $user = auth('api')->setToken($token)->user();

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => $user
        ]);
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

        return response()->json([
            'success' => true,
            'message' => 'Register berhasil',
            'user' => $user
        ], 201);
    }

    // PROFILE
    public function profile()
    {
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => '401 Unauthorized'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'user' => auth()->user()
        ]);
    }

    // ME
    public function me(Request $request)
    {
        try {
            $token = $request->bearerToken() ?? $request->query('token');

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => '400 Token Missing'
                ], 400);
            }

            $user = auth('api')->setToken($token)->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => '401 Unauthorized'
                ], 401);
            }

            return response()->json($user);

        } catch (TokenExpiredException $e) {
            return response()->json(['message' => '401 Token Expired'], 401);

        } catch (TokenInvalidException $e) {
            return response()->json(['message' => '401 Unauthorized'], 401);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '500 Server Error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // LOGOUT
    public function logout(Request $request)
    {
        try {
            $token = $request->bearerToken() ?? $request->query('token');

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => '400 Token Missing'
                ], 400);
            }

            auth('api')->setToken($token)->invalidate();

            return response()->json([
                'success' => true,
                'message' => 'Logout berhasil'
            ]);

        } catch (TokenExpiredException $e) {
            return response()->json(['message' => '401 Token Expired'], 401);

        } catch (TokenInvalidException $e) {
            return response()->json(['message' => '401 Unauthorized'], 401);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '500 Server Error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // UPDATE PROFILE
    public function updateProfile(Request $request)
    {
        try {
            $user = auth('api')->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => '401 Unauthorized'
                ], 401);
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

            return response()->json([
                'success' => true,
                'message' => 'Profil berhasil diperbarui',
                'data' => $user
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui profil',
                'error' => $e->getMessage()
            ], 500);
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
                return response()->json([
                    'success' => false,
                    'message' => '401 Unauthorized'
                ], 401);
            }

            $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6|confirmed',
            ]);

            // Check if current password is correct
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password lama tidak sesuai'
                ], 400);
            }

            // Update password
            $user->update([
                'password' => bcrypt($request->new_password)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil diubah'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengubah password',
                'error' => $e->getMessage()
            ], 500);
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
            return response()->json([
                'success' => false,
                'message' => 'Email tidak terdaftar',
            ], 404);
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

            return response()->json([
                'success' => true,
                'message' => 'Kode OTP telah dikirim ke email Anda',
                'expires_in' => $expiryMinutes * 60, // in seconds
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email. Silakan coba lagi.',
            ], 500);
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
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak valid',
            ], 400);
        }

        if (!$otpRecord->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP sudah kadaluarsa',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Kode OTP valid',
        ]);
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
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak valid atau sudah kadaluarsa',
            ], 400);
        }

        // Find user
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan',
            ], 404);
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

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset. Silakan login dengan password baru Anda.',
        ]);
    }
}
