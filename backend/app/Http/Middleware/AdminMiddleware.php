<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Admin;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Ensure the authenticated model is an Admin
        if (! $user || ! $user instanceof Admin) {
            return response()->json([
                'message' => 'Access denied: Admins only.'
            ], 403);
        }

        return $next($request);
    }
}
