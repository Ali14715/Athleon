<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, $role)
    {
        $user = JWTAuth::parseToken()->authenticate(); 

        /*if ($request->has('token')) {
            $token = $request->query('token');
            auth()->setToken($token);
            $user = auth()->authenticate();
        } else {
            $user = auth()->parseToken()->authenticate();
        }*/

        if (!$user || $user->role !== $role) {
            return response()->json(['message' => 'Akses ditolak, role tidak sesuai.'], 403);
        }

        return $next($request);
    }
}
