<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class KycApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user)
    {
    }

    public function build()
    {
        $frontend = rtrim(env('APP_FRONTEND_URL', config('app.url')), '/');

        return $this->subject('Your KYC is approved')
            ->view('emails.kyc-approved')
            ->with([
                'name' => $this->user->name,
                'policiesUrl' => $frontend . '/client/policies',
            ]);
    }
}
