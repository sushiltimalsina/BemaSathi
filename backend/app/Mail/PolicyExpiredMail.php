<?php

namespace App\Mail;

use App\Models\BuyRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class PolicyExpiredMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public BuyRequest $buyRequest)
    {
    }

    public function build()
    {
        $timezone = config('app.timezone', 'Asia/Kathmandu');
        $policyName = $this->buyRequest->policy?->policy_name ?? 'your policy';
        $companyName = $this->buyRequest->policy?->company_name ?? 'our partner';
        $expiryDateText = $this->buyRequest->next_renewal_date
            ? Carbon::parse($this->buyRequest->next_renewal_date)
                ->timezone($timezone)
                ->toFormattedDateString()
            : 'the renewal date';

        $frontend = rtrim(
            config('app.frontend_url')
            ?? env('APP_FRONTEND_URL')
            ?? env('FRONTEND_URL')
            ?? config('app.url')
            ?? url('/'),
            '/'
        );

        $renewPath = "/client/payment?request={$this->buyRequest->id}";
        $renewalUrl = $frontend . '/login?redirect=' . rawurlencode($renewPath);

        return $this->subject('Policy Expired')
            ->view('emails.policy-expired')
            ->with([
                'name' => $this->buyRequest->user?->name,
                'policyName' => $policyName,
                'companyName' => $companyName,
                'expiryDateText' => $expiryDateText,
                'renewalUrl' => $renewalUrl,
            ]);
    }
}
