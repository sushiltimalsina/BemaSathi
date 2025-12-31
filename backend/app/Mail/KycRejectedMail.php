<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class KycRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public ?string $reason = null)
    {
    }

    public function build()
    {
        $frontend = rtrim(env('APP_FRONTEND_URL', config('app.url')), '/');

        return $this->subject('Your KYC needs attention')
            ->view('emails.kyc-rejected')
            ->with([
                'name' => $this->user->name,
                'reason' => $this->reason,
                'resubmitUrl' => $frontend . '/client/kyc',
            ]);
    }
}
