<?php

namespace App\Http\Controllers;

use App\Mail\WelcomeMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'phone'    => 'required|string|regex:/^[0-9]{10}$/',
            'email'    => 'required|email|unique:users,email',
            'address'  => 'required|string|max:255',
            'password' => 'required|string|min:6',

            // FIELDS USED BY RECOMMENDATION ENGINE
            'dob' => 'required|date|before:today|after:1900-01-01|before:-15 years',
            'budget_range' => 'required|string',
            'coverage_type' => 'required|in:individual,family',
            'is_smoker' => 'required|boolean',
            'pre_existing_conditions' => 'nullable|array',
            'pre_existing_conditions.*' => 'in:diabetes,heart,hypertension,asthma',
        ]);

        $user = User::create([
            'name'      => $data['name'],
            'phone'     => $data['phone'],
            'email'     => $data['email'],
            'address'   => $data['address'],

            // NEW FIELDS
            'dob' => $data['dob'],
            'budget_range' => $data['budget_range'],
            'coverage_type' => $data['coverage_type'],
            'is_smoker' => $data['is_smoker'],
            'pre_existing_conditions' => $data['pre_existing_conditions'] ?? [],

            'password'  => Hash::make($data['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        if ($user->email) {
            try {
                Mail::to($user->email)->send(new WelcomeMail($user));
            } catch (\Throwable $e) {
                Log::warning('Failed sending welcome email', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Registration successful',
            'token'   => $token,
            'user'    => $user
        ]);
    }


    /**
     * Login user
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token'   => $token,
            'user'    => $user
        ]);
    }


    /**
     * Return authenticated user
     */
    public function me(Request $request)
    {
        return response()->json($request->user());
    }


/**
 * UPDATE USER PROFILE (NEW + IMPORTANT)
 * Used by: MyProfile.jsx / Dashboard.jsx / Recommendation engine / Premium calc
 */
public function updateProfile(Request $request)
{
    $user = auth()->user();

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'phone' => 'nullable|string|max:30',
        'address' => 'nullable|string|max:255',
        'dob' => 'nullable|date',
        'is_smoker' => 'nullable|boolean',
        'budget_range' => 'nullable|string',
        'coverage_type' => 'nullable|string',
        'pre_existing_conditions' => 'nullable|array',
        'pre_existing_conditions.*' => 'in:diabetes,heart,hypertension,asthma',
    ]);

    $user->update([
        'name' => $validated['name'],
        'phone' => $validated['phone'] ?? $user->phone,
        'address' => $validated['address'] ?? $user->address,
        'dob' => $validated['dob'] ?? $user->dob,
        'is_smoker' => $validated['is_smoker'] ?? $user->is_smoker,
        'budget_range' => $validated['budget_range'] ?? $user->budget_range,
        'coverage_type' => $validated['coverage_type'] ?? $user->coverage_type,
        'pre_existing_conditions' => $validated['pre_existing_conditions']
            ?? $user->pre_existing_conditions,
    ]);

    return response()->json([
        'message' => 'Profile updated successfully.',
        'user' => $user
    ]);
}



    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
