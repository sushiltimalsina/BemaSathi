<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Admin;

class AdminAuth
{
    public function handle($request, Closure $next)
    {
        $token = $request->header('Admin-Authorization');

        if (!$token) {
            return response()->json(['message' => 'Missing admin token'], 401);
        }

        $admin = Admin::where('admin_token', $token)->first();

        if (!$admin) {
            return response()->json(['message' => 'Invalid admin token'], 401);
        }

        $request->admin = $admin;

        return $next($request);
    }
}
