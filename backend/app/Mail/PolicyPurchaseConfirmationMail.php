<?php

namespace App\Mail;

use App\Models\Payment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

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
        $recipientEmail = $this->payment->buyRequest?->email ?? $user?->email;

        $policyNumber = 'BS-' . str_pad((string) $this->payment->id, 6, '0', STR_PAD_LEFT);
        $timezone = config('app.timezone', 'Asia/Kathmandu');
        $effectiveDate = Carbon::parse($this->payment->verified_at ?? $this->payment->paid_at ?? now())
            ->timezone($timezone);
        $billingCycle = $this->payment->buyRequest?->billing_cycle ?? $this->payment->billing_cycle ?? 'yearly';
        $premium = $this->payment->buyRequest?->cycle_amount ?? $this->payment->amount ?? 0;
        $nextRenewalDate = $this->payment->buyRequest?->next_renewal_date
            ? Carbon::parse($this->payment->buyRequest->next_renewal_date)->timezone($timezone)
            : null;
        $paymentType = $this->resolvePaymentType();
        $healthData = $this->payment->buyRequest?->health_declaration
                ?? $this->payment->paymentIntent?->health_declaration
                ?? $this->payment->paymentIntent?->meta['health_declaration']
                ?? null;

        $pdf = null;
        try {
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
                'userEmail' => $recipientEmail,
                'userPhone' => $kyc?->phone ?? $user?->phone,
                'userAddress' => $kyc?->address ?? $user?->address,
                'userDob' => $kyc?->dob ?? $user?->dob,
                'userDocumentNumber' => $kyc?->document_number,
                'userOccupation' => $user?->occupation_class,
                'userBmi' => $this->calculateBmi($user),
                'userSmoker' => $user?->is_smoker,
                'paymentType' => $paymentType,
                'healthDeclaration' => $healthData,
                'taxAmount' => round($premium * 0.13, 2), // 13% VAT
                'subtotal' => round($premium / 1.13, 2),
            ]);
        } catch (\Throwable $e) {
            Log::error('Policy document PDF generation failed', [
                'payment_id' => $this->payment->id,
                'error' => $e->getMessage(),
            ]);
            // Safety Fallback for Policy Document
            $pdf = Pdf::loadHTML("
                <div style='font-family: sans-serif; padding: 40px;'>
                    <h1>Insurance Policy Certificate</h1>
                    <p>Policy Number: <strong>{$policyNumber}</strong></p>
                    <p>Holder: <strong>" . ($user?->name ?? 'Policy Holder') . "</strong></p>
                    <p>Policy: <strong>" . ($policy?->policy_name ?? 'Insurance Policy') . "</strong></p>
                    <hr/>
                    <p>Certificate generation pending final review.</p>
                </div>
            ");
        }

        $mail = $this->subject('Policy Purchase Confirmation')
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
                'paymentType' => $paymentType,
                'nextRenewalDate' => $nextRenewalDate,
            ]);

        if ($pdf) {
            $mail->attachData($pdf->output(), "policy-{$policyNumber}.pdf", [
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

    private function calculateBmi($user): string
    {
        if (!$user || !$user->weight_kg || !$user->height_cm) {
            return 'N/A';
        }

        $heightM = $user->height_cm / 100;
        $bmi = $user->weight_kg / ($heightM * $heightM);
        
        return number_format($bmi, 1);
    }
}
