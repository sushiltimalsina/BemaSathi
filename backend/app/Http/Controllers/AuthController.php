<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\WelcomeMail;

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
            'family_members' => 'exclude_unless:coverage_type,family|required|integer|min:2|max:20',
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
            'family_members' => ($data['coverage_type'] === 'family')
                ? max(2, (int) ($data['family_members'] ?? 2))
                : 1,
            'is_smoker' => $data['is_smoker'],
            'pre_existing_conditions' => $data['pre_existing_conditions'] ?? [],

            'password'  => Hash::make($data['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        if ($user->email) {
            try {
                dispatch(function () use ($user) {
                    Mail::to($user->email)->send(new WelcomeMail($user));
                })->afterResponse();
            } catch (\Throwable $e) {
                Log::warning('Failed sending welcome email', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return response()->json([
            'message' => 'Registration successful! Please check your email to verify your account.',
            'requires_verification' => true,
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

        if (!$user) {
            return response()->json(['message' => 'Invalid email'], 404);
        }

        if (!Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Invalid password'], 401);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Please verify your email address before logging in.',
                'unverified' => true
            ], 403);
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
        'dob' => 'nullable|date|before:today',
        'is_smoker' => 'nullable|boolean',
        'budget_range' => 'nullable|string',
        'coverage_type' => 'nullable|in:individual,family',
        'family_members' => 'nullable|integer|min:1|max:20',
        'pre_existing_conditions' => 'nullable|array',
        'pre_existing_conditions.*' => 'in:diabetes,heart,hypertension,asthma',
        'family_member_details' => 'nullable|array',
        'family_member_details.*.name' => 'required|string|max:255',
        'family_member_details.*.relation' => 'required|string|in:Self,Spouse,Son,Daughter,Father,Mother,Brother,Sister,Grandfather,Grandmother',
        'family_member_details.*.dob' => 'required|date|before:today',
    ]);

    $latestKyc = $user->kycDocuments()->latest()->first();
    $allowDobEdit = !$latestKyc
        || $latestKyc->status === 'rejected'
        || ($latestKyc->status === 'approved' && $latestKyc->allow_edit);

    $coverageType = $validated['coverage_type'] ?? $user->coverage_type;
    $familyCount = ($coverageType === 'family')
        ? max(2, (int) ($validated['family_members'] ?? $user->family_members ?? 2))
        : 1;
    $familyDetails = $validated['family_member_details']
        ?? $user->family_member_details
        ?? [];

    if ($coverageType === 'family' && !empty($validated['family_member_details'])) {
        if (count($familyDetails) !== $familyCount) {
            return response()->json([
                'message' => 'The number of family member details provided does not match the family members count.',
            ], 422);
        }
        $selfName = $validated['name'];
        $selfDob = ($allowDobEdit && isset($validated['dob'])) ? $validated['dob'] : $user->dob;
        $familyDetails = array_values($familyDetails);
        $familyDetails[0] = [
            'name' => $selfName,
            'relation' => 'Self',
            'dob' => $selfDob,
        ];
    } elseif ($coverageType === 'individual') {
        $familyDetails = [];
    }

    $user->update([
        'name' => $validated['name'],
        'phone' => $validated['phone'] ?? $user->phone,
        'address' => $validated['address'] ?? $user->address,
        'dob' => $allowDobEdit && isset($validated['dob']) ? $validated['dob'] : $user->dob,
        'is_smoker' => $validated['is_smoker'] ?? $user->is_smoker,
        'budget_range' => $validated['budget_range'] ?? $user->budget_range,
        'coverage_type' => $coverageType,
        'family_members' => $familyCount,
        'family_member_details' => $familyDetails,
        'pre_existing_conditions' => $validated['pre_existing_conditions']
            ?? $user->pre_existing_conditions,
    ]);

    return response()->json([
        'message' => 'Profile updated successfully.',
        'user' => $user
    ]);
}



    public function verifyEmail(Request $request, $id, $hash)
    {
        $user = User::findOrFail($id);

        if (!hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
            return response()->json(['message' => 'Invalid verification link.'], 403);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if ($user->markEmailAsVerified()) {
            event(new \Illuminate\Auth\Events\Verified($user));
        }

        return response()->json(['message' => 'Email verified successfully! You can now login.']);
    }

    public function resendVerification(Request $request)
    {
        $data = $request->validate(['email' => 'required|email']);
        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        try {
            dispatch(function () use ($user) {
                Mail::to($user->email)->send(new WelcomeMail($user));
            })->afterResponse();
            return response()->json(['message' => 'Verification email resent.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to resend email.'], 500);
        }
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
