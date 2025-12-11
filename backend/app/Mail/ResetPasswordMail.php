<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $token;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $token)
    {
        $this->user = $user;
        $this->token = $token;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $resetLink = env('APP_FRONTEND_URL', 'http://localhost:5173') .
            '/reset-password?token=' . urlencode($this->token) .
            '&email=' . urlencode($this->user->email);

        return $this->subject('Reset your password')
            ->view('emails.reset')
            ->with([
                'name' => $this->user->name,
                'token' => $this->token,
                'resetLink' => $resetLink,
                'isOtp' => true,
            ]);
    }
}
