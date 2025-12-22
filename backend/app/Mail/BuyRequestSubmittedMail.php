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
        $this->buyRequest->loadMissing('policy', 'user');
        $frontend = rtrim(env('APP_FRONTEND_URL', config('app.url')), '/');

        $policyName = $this->buyRequest->policy?->policy_name ?? 'your policy';
        $companyName = $this->buyRequest->policy?->company_name ?? 'Insurance Company';

        return $this->subject('Your Buy Request Has Been Submitted Successfully')
            ->view('emails.buy-request-submitted')
            ->with([
                'name' => $this->buyRequest->user?->name ?? $this->buyRequest->name,
                'policyName' => $policyName,
                'companyName' => $companyName,
                'billingCycle' => $this->buyRequest->billing_cycle ?? 'yearly',
                'amount' => $this->buyRequest->cycle_amount ?? $this->buyRequest->calculated_premium,
                'paymentUrl' => $frontend . '/client/payment?buy_request_id=' . $this->buyRequest->id,
            ]);
    }
}
