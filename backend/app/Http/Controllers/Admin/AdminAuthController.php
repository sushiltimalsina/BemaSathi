<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    /**
     * Admin Login
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required'
        ]);

        $admin = Admin::where('email', $request->email)->first();

        // If no admin found
        if (! $admin) {
            return response()->json(['message' => 'Admin account not found'], 404);
        }

        // Password check
        if (! Hash::check($request->password, $admin->password)) {
            return response()->json(['message' => 'Invalid password'], 401);
        }

        // Create token
        $token = $admin->createToken('admin_token')->plainTextToken;

        return response()->json([
            'message' => 'Admin login successful',
            'token'   => $token,
            'admin'   => $admin
        ]);
    }

    /**
     * Create a new admin (protected; must be an existing admin)
     */
    public function register(Request $request)
    {
        $request->validate([
            'name'     => 'required|string',
            'phone'    => 'required|string',
            'email'    => 'required|email|unique:admins,email',
            'password' => 'required|min:8',
        ]);

        $admin = Admin::create([
            'name'     => $request->name,
            'phone'    => $request->phone,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Admin created successfully',
            'admin'   => $admin,
        ], 201);
    }

    /**
     * Admin Logout
     */
    public function logout(Request $request)
    {
        // Delete ONLY the current token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Admin logged out successfully'
        ]);
    }
}
