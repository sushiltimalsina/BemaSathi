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
        $kyc = $user?->kycDocuments()?->where('status', 'approved')->latest()->first();

        $policyNumber = 'BS-' . str_pad((string) $this->payment->id, 6, '0', STR_PAD_LEFT);
        $effectiveDate = $this->payment->verified_at ?? $this->payment->paid_at ?? now();
        $billingCycle = $this->payment->buyRequest?->billing_cycle ?? $this->payment->billing_cycle ?? 'yearly';
        $premium = $this->payment->buyRequest?->cycle_amount ?? $this->payment->amount ?? 0;
        $nextRenewalDate = $this->payment->buyRequest?->next_renewal_date;

        $pdf = Pdf::loadView('pdfs.policy-document', [
            'policyNumber' => $policyNumber,
            'policyName' => $policy?->policy_name ?? 'Policy',
            'companyName' => $policy?->company_name ?? 'Insurance Company',
            'insuranceType' => $policy?->insurance_type,
            'coverageLimit' => $policy?->coverage_limit ?? 'N/A',
            'premium' => $premium,
            'billingCycle' => $billingCycle,
            'effectiveDate' => $effectiveDate,
            'nextRenewalDate' => $nextRenewalDate,
            'policyDescription' => $policy?->policy_description,
            'coveredConditions' => $policy?->covered_conditions,
            'exclusions' => $policy?->exclusions,
            'waitingPeriodDays' => $policy?->waiting_period_days,
            'copayPercent' => $policy?->copay_percent,
            'claimSettlementRatio' => $policy?->claim_settlement_ratio,
            'supportsSmokers' => $policy?->supports_smokers,
            'userName' => $kyc?->full_name ?? $user?->name ?? 'Policy Holder',
            'userEmail' => $user?->email,
            'userPhone' => $kyc?->phone ?? $user?->phone,
            'userAddress' => $kyc?->address ?? $user?->address,
            'userDob' => $kyc?->dob ?? $user?->dob,
            'userDocumentNumber' => $kyc?->document_number,
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
