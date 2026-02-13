<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class SocialAuthController extends Controller
{
    public function handleGoogleCallback(Request $request)
    {
        $request->validate([
            'token' => 'required'
        ]);

        try {
            \Log::info('Google Auth Attempt', ['token' => substr($request->token, 0, 10) . '...']);
            // In an API setup, we must use stateless() because there is no session to verify state
            $socialUser = Socialite::driver('google')->stateless()->userFromToken($request->token);
            \Log::info('Google User Retrieved', ['email' => $socialUser->getEmail()]);

            $user = User::updateOrCreate([
                'email' => $socialUser->getEmail(),
            ], [
                'name' => $socialUser->getName(),
                'google_id' => $socialUser->getId(),
                'avatar' => $socialUser->getAvatar(),
                'password' => bcrypt(Str::random(24)), // Random password for social users
            ]);

            // Determine if the user needs to complete their profile (DOB and Coverage Type are required)
            $needsOnboarding = empty($user->dob) || empty($user->coverage_type);

            \Log::info('Google Login Result', [
                'email' => $user->email,
                'was_created' => $user->wasRecentlyCreated,
                'needs_onboarding' => $needsOnboarding,
                'dob' => $user->dob,
                'coverage' => $user->coverage_type
            ]);

            $token = $user->createToken('google-auth-token')->plainTextToken;

            return response()->json([
                'user' => $user,
                'token' => $token,
                'is_new' => $needsOnboarding, // Use the more specific check
            ]);

        } catch (\Exception $e) {
            \Log::error('Google Auth Error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Google authentication failed.',
                'error' => $e->getMessage()
            ], 422);
        }
    }
}
