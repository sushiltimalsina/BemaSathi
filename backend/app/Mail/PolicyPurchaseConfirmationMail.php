<?php

namespace App\Mail;

use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PolicyPurchaseConfirmationMail extends Mailable
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

        $policyNumber = 'BS-' . str_pad((string) $this->payment->id, 6, '0', STR_PAD_LEFT);
        $effectiveDate = $this->payment->verified_at ?? $this->payment->paid_at ?? now();
        $billingCycle = $this->payment->buyRequest?->billing_cycle ?? $this->payment->billing_cycle ?? 'yearly';
        $premium = $this->payment->buyRequest?->cycle_amount ?? $this->payment->amount ?? 0;

        $pdf = Pdf::loadView('pdfs.policy-document', [
            'policyNumber' => $policyNumber,
            'policyName' => $policy?->policy_name ?? 'Policy',
            'companyName' => $policy?->company_name ?? 'Insurance Company',
            'coverageLimit' => $policy?->coverage_limit ?? 'N/A',
            'premium' => $premium,
            'billingCycle' => $billingCycle,
            'effectiveDate' => $effectiveDate,
            'userName' => $user?->name ?? 'Policy Holder',
            'userEmail' => $user?->email,
        ]);

        return $this->subject('Policy Purchase Confirmation')
            ->view('emails.policy-purchase-confirmation')
            ->with([
                'name' => $user?->name ?? 'there',
                'policyNumber' => $policyNumber,
                'policyName' => $policy?->policy_name ?? 'Policy',
                'companyName' => $policy?->company_name ?? 'Insurance Company',
                'coverageLimit' => $policy?->coverage_limit ?? 'N/A',
                'premium' => $premium,
                'billingCycle' => $billingCycle,
                'effectiveDate' => $effectiveDate,
            ])
            ->attachData($pdf->output(), "policy-{$policyNumber}.pdf", [
                'mime' => 'application/pdf',
            ]);
    }
}
