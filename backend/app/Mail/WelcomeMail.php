<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function build()
    {
        $frontend = rtrim(config('app.frontend_url', config('app.url')), '/');

        return $this->subject('Welcome to BeemaSathi - Verify Your Email')
            ->view('emails.welcome')
            ->with([
                'name' => $this->user->name,
                'verifyUrl' => $frontend . '/verify-email?id=' . $this->user->id . '&hash=' . sha1($this->user->getEmailForVerification()),
                'kycUrl' => $frontend . '/client/kyc',
                'profileUrl' => $frontend . '/client/profile',
                'policiesUrl' => $frontend . '/client/policies',
            ]);
    }
}
