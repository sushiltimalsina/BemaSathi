<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Models\User;
use App\Mail\ResetPasswordMail;

class PasswordResetController extends Controller
{
    // Request a reset token and send via email.
    public function forgot(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $user = User::where('email', $credentials['email'])->firstOrFail();
        // Generate numeric OTP and store hashed in password_reset_tokens table
        $otp = (string) random_int(100000, 999999);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => Hash::make($otp), 'created_at' => now()]
        );

        // Send reset email
        Mail::to($user->email)->send(new ResetPasswordMail($user, $otp));

        return response()->json([
            'message' => 'Reset link sent if the email exists.',
        ]);
    }

    // Reset password using email + token.
    public function reset(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $status = Password::reset(
            [
                'email' => $data['email'],
                'token' => $data['token'],
                'password' => $data['password'],
                'password_confirmation' => $request->input('password_confirmation'),
            ],
            function ($user, $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password reset successful.']);
        }

        return response()->json(['message' => 'Invalid token or email.'], 422);
    }
}
