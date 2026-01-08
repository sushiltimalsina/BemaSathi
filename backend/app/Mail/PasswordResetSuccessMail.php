<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use App\Models\User;

class PasswordResetSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public User $user;

    public function __construct(User $user)
    {
        $this->user = $user;
    }

    public function build()
    {
        $base = rtrim(config('app.frontend_url', config('app.url')), '/');
        $loginUrl = $base . '/login';

        $tz = 'Asia/Kathmandu';
        $resetAtText = now()
            ->timezone($tz)
            ->format('M j, Y g:i A');

        return $this->subject('Your password was changed')
            ->view('emails.password-reset-success')
            ->with([
                'name' => $this->user->name,
                'email' => $this->user->email,
                'loginUrl' => $loginUrl,
                'resetAtText' => $resetAtText,
                'timezoneLabel' => 'NPT',
            ]);
    }
}
