<?php

namespace App\Mail;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

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
        $paymentType = $this->resolvePaymentType();
        $timezone = config('app.timezone', 'Asia/Kathmandu');
        $failedAt = Carbon::parse($this->payment->updated_at ?? now())->timezone($timezone);

        return $this->subject('Payment Failed')
            ->view('emails.payment-failure')
            ->with([
                'name' => $user?->name ?? 'there',
                'policyName' => $policy?->policy_name ?? 'your policy',
                'reason' => $this->reason ?? ($this->payment->meta['reason'] ?? null),
                'retryUrl' => $frontend . '/client/payment?buy_request_id=' . ($this->payment->buy_request_id ?? ''),
                'paymentType' => $paymentType,
                'failedAt' => $failedAt,
            ]);
    }

    private function resolvePaymentType(): string
    {
        $buyRequestId = $this->payment->buy_request_id;
        if (!$buyRequestId) {
            return 'new';
        }

        $otherVerified = Payment::where('buy_request_id', $buyRequestId)
            ->where('is_verified', true)
            ->where('id', '!=', $this->payment->id)
            ->exists();

        return $otherVerified ? 'renewal' : 'new';
    }
}
