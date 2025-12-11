<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Admin;

class ApiTokenMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->header('Authorization');

        if (!$token) {
            return response()->json(['message' => 'Unauthorized: Missing token'], 401);
        }

        $token = str_replace('Bearer ', '', $token);

        // Check user token
        $user = User::where('api_token', $token)->first();
        if ($user) {
            $request->setUserResolver(function () use ($user) {
                return $user;
            });

            return $next($request);
        }

        // Check admin token
        $admin = Admin::where('api_token', $token)->first();
        if ($admin) {
            $request->attributes->set('admin', $admin);
            return $next($request);
        }

        return response()->json(['message' => 'Unauthorized: Invalid token'], 401);
    }
}
