<?php

namespace App\Mail;

use App\Models\BuyRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BuyRequestSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public BuyRequest $buyRequest)
    {
    }

    public function build()
    {
        $frontend = rtrim(config('app.frontend_url', config('app.url')), '/');

        return $this->subject('Your Buy Request Has Been Submitted Successfully')
            ->view('emails.buy-request-submitted')
            ->with([
                'userName' => $this->buyRequest->name ?? $this->buyRequest->user?->name,
                'policyName' => $this->buyRequest->policy?->policy_name,
                'paymentUrl' => $frontend . '/client/payment?buy_request_id=' . $this->buyRequest->id,
            ]);
    }
}
