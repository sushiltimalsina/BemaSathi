<?php

namespace App\Mail;

use App\Models\BuyRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class PolicyRenewalReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public BuyRequest $buyRequest)
    {
    }

    public function build()
    {
        $this->buyRequest->loadMissing('user', 'policy');
        $frontend = rtrim(config('app.frontend_url', config('app.url')), '/');
        $timezone = config('app.timezone', 'Asia/Kathmandu');

        $renewPath = '/client/payment?request=' . $this->buyRequest->id;
        $renewalUrl = $frontend . '/login?redirect=' . rawurlencode($renewPath);
        $renewalDateText = $this->buyRequest->next_renewal_date
            ? Carbon::parse($this->buyRequest->next_renewal_date)->timezone($timezone)->toFormattedDateString()
            : 'N/A';

        return $this->subject('Policy Renewal Reminder')
            ->view('emails.policy-renewal-reminder')
            ->with([
                'name' => $this->buyRequest->user?->name ?? $this->buyRequest->name,
                'policyName' => $this->buyRequest->policy?->policy_name ?? 'your policy',
                'companyName' => $this->buyRequest->policy?->company_name ?? 'Insurance Company',
                'renewalDateText' => $renewalDateText,
                'amount' => $this->buyRequest->cycle_amount,
                'billingCycle' => $this->buyRequest->billing_cycle ?? 'yearly',
                'renewalUrl' => $renewalUrl,
            ]);
    }
}
