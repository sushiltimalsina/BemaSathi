<?php

namespace App\Mail;

use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

class PaymentSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Payment $payment)
    {
    }

    public function build()
    {
        $this->payment->loadMissing('user', 'policy', 'buyRequest.policy');

        $policy = $this->payment->policy ?? $this->payment->buyRequest?->policy;
        $user = $this->payment->user;
        $recipientEmail = $this->payment->buyRequest?->email ?? $user?->email;
        $billingCycle = $this->payment->buyRequest?->billing_cycle ?? $this->payment->billing_cycle ?? 'yearly';
        $transactionId = $this->payment->provider_reference
            ?? ($this->payment->meta['transaction_uuid'] ?? (string) $this->payment->id);
        $timezone = config('app.timezone', 'Asia/Kathmandu');
        $paidAt = Carbon::parse($this->payment->verified_at ?? $this->payment->paid_at ?? now())
            ->timezone($timezone);
        $receiptNumber = 'RCPT-' . str_pad((string) $this->payment->id, 6, '0', STR_PAD_LEFT);
        $policyNumber = $this->resolvePolicyNumber();
        $nextRenewalDate = $this->payment->buyRequest?->next_renewal_date
            ? Carbon::parse($this->payment->buyRequest->next_renewal_date)->timezone($timezone)
            : null;
        $paymentType = $this->resolvePaymentType();

        $pdf = null;
        try {
            $pdf = Pdf::loadView('pdfs.payment-receipt', [
                'receiptNumber' => $receiptNumber,
                'policyNumber' => $policyNumber,
                'transactionId' => $transactionId,
                'amount' => $this->payment->amount,
                'currency' => $this->payment->currency ?? 'NPR',
                'paidAt' => $paidAt,
                'policyName' => $policy?->policy_name ?? 'Policy',
                'companyName' => $policy?->company_name ?? 'Insurance Company',
                'billingCycle' => $billingCycle,
                'userName' => $user?->name ?? 'Customer',
                'userEmail' => $recipientEmail,
                'nextRenewalDate' => $nextRenewalDate,
                'paymentType' => $paymentType,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Payment receipt PDF generation failed', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage(),
            ]);
        }

        $mail = $this->subject('Payment Successful - Receipt')
            ->view('emails.payment-success')
            ->with([
                'name' => $user?->name ?? 'there',
                'policyNumber' => $policyNumber,
                'policyName' => $policy?->policy_name ?? 'Policy',
                'companyName' => $policy?->company_name ?? 'Insurance Company',
                'billingCycle' => $billingCycle,
                'amount' => $this->payment->amount,
                'transactionId' => $transactionId,
                'paidAt' => $paidAt,
                'nextRenewalDate' => $nextRenewalDate,
                'paymentType' => $paymentType,
            ]);

        if ($pdf) {
            $mail->attachData($pdf->output(), "receipt-{$receiptNumber}.pdf", [
                'mime' => 'application/pdf',
            ]);
        }

        return $mail;
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

    private function resolvePolicyNumber(): string
    {
        $buyRequestId = $this->payment->buy_request_id;
        if (!$buyRequestId) {
            return 'BS-' . str_pad((string) $this->payment->id, 6, '0', STR_PAD_LEFT);
        }

        $firstPayment = Payment::where('buy_request_id', $buyRequestId)
            ->where('is_verified', true)
            ->orderByRaw('COALESCE(verified_at, paid_at, created_at) asc')
            ->first();

        $baseId = $firstPayment?->id ?? $this->payment->id;
        return 'BS-' . str_pad((string) $baseId, 6, '0', STR_PAD_LEFT);
    }
}
