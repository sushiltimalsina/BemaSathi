<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin || !password_verify($request->password, $admin->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Generate admin token
        $token = bin2hex(random_bytes(32));
        $admin->admin_token = $token;
        $admin->save();

        return response()->json([
            'message' => 'Admin login successful',
            'admin_token' => $token
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'admin' => $request->admin
        ]);
    }
}
