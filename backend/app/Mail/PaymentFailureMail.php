<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentFailureMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Payment $payment, public ?string $reason = null)
    {
    }

    public function build()
    {
        $this->payment->loadMissing('user', 'policy', 'buyRequest.policy');

        $policy = $this->payment->policy ?? $this->payment->buyRequest?->policy;
        $user = $this->payment->user;
        $frontend = rtrim(config('app.frontend_url', config('app.url')), '/');

        return $this->subject('Payment Failed')
            ->view('emails.payment-failure')
            ->with([
                'name' => $user?->name ?? 'there',
                'policyName' => $policy?->policy_name ?? 'your policy',
                'reason' => $this->reason ?? ($this->payment->meta['reason'] ?? null),
                'retryUrl' => $frontend . '/client/payment?buy_request_id=' . ($this->payment->buy_request_id ?? ''),
            ]);
    }
}
