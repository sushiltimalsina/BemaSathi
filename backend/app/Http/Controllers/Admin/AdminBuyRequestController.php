<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuyRequest;
use App\Models\Notification;
use Illuminate\Http\Request;

class AdminBuyRequestController extends Controller
{
    public function index()
    {
        return BuyRequest::with(['policy', 'user'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function show(BuyRequest $buyRequest)
    {
        $buyRequest->load(['policy', 'user']);
        return response()->json($buyRequest);
    }

    public function update(BuyRequest $buyRequest, Request $request)
    {
        $validated = $request->validate([
            'billing_cycle' => 'nullable|in:monthly,quarterly,half_yearly,yearly',
            'cycle_amount' => 'nullable|numeric|min:0',
            'next_renewal_date' => 'nullable|date',
            'renewal_status' => 'nullable|in:active,due,expired',
        ]);

        $buyRequest->update(array_filter($validated, fn ($value) => $value !== null));

        // Notify client about updates (no agent assignment tracking)
        Notification::create([
            'user_id' => $buyRequest->user_id,
            'title' => 'Request Updated',
            'message' => 'Your request details were updated by the admin.',
            'buy_request_id' => $buyRequest->id,
            'policy_id' => $buyRequest->policy_id,
        ]);

        return response()->json([
            'message'    => 'Buy request updated successfully',
            'buyRequest' => $buyRequest->fresh(['policy','user']),
        ]);
    }

public function destroy(BuyRequest $buyRequest)
{
    $buyRequest->delete(); // SOFT DELETE

    return response()->json(['message' => 'Buy request moved to trash']);
}

public function trash()
{
    return BuyRequest::onlyTrashed()->get();
}

public function restore($id)
{
    BuyRequest::onlyTrashed()->where('id', $id)->restore();
    return response()->json(['message' => 'Buy request restored']);
}

    public function forceDelete($id)
    {
        BuyRequest::onlyTrashed()->where('id', $id)->forceDelete();
        return response()->json(['message' => 'Buy request permanently deleted']);
    }

    public function policyDocument(BuyRequest $buyRequest)
    {
        $payment = $buyRequest->payments()->where('is_verified', true)->first();
        if (!$payment) {
            return response()->json(['message' => 'No verified payment found for this request'], 404);
        }

        $mail = new \App\Mail\PolicyPurchaseConfirmationMail($payment);
        $mail->build(); // Loads relations and sets up PDF

        // A bit of a hack to get the PDF from the mailable's build process
        // In a real scenario, we might want a dedicated Service for PDF generation
        $policy = $payment->policy ?? $buyRequest->policy;
        $user = $payment->user;
        $kyc = $user?->kycDocuments()?->where('status', 'approved')->latest()->first();
        $recipientEmail = $buyRequest->email ?? $user?->email;
        $policyNumber = 'BS-' . str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT);
        $tz = 'Asia/Kathmandu';
        $effectiveDate = \Illuminate\Support\Carbon::parse($payment->verified_at ?? $payment->paid_at ?? now())->timezone($tz);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.policy-document', [
            'policyNumber' => $policyNumber,
            'policyName' => $policy?->policy_name ?? 'Policy',
            'companyName' => $policy?->company_name ?? 'Insurance Company',
            'insuranceType' => $policy?->insurance_type ?? 'Medical',
            'coverageLimit' => $policy?->coverage_limit ?? 'N/A',
            'premium' => $buyRequest->cycle_amount ?? $payment->amount ?? 0,
            'billingCycle' => $buyRequest->billing_cycle ?? 'yearly',
            'effectiveDate' => $effectiveDate,
            'nextRenewalDate' => $buyRequest->next_renewal_date,
            'policyDescription' => $policy?->policy_description ?? '',
            'coveredConditions' => $policy?->covered_conditions ?? [],
            'exclusions' => $policy?->exclusions ?? [],
            'waitingPeriodDays' => $policy?->waiting_period_days ?? 0,
            'copayPercent' => $policy?->copay_percent ?? 0,
            'claimSettlementRatio' => $policy?->claim_settlement_ratio ?? 0,
            'supportsSmokers' => $policy?->supports_smokers ?? false,
            'userName' => $kyc?->full_name ?? $user?->name ?? 'Policy Holder',
            'userEmail' => $recipientEmail ?? 'N/A',
            'userPhone' => $kyc?->phone ?? $user?->phone ?? 'N/A',
            'userAddress' => $kyc?->address ?? $user?->address ?? 'N/A',
            'userDob' => $kyc?->dob ?? $user?->dob,
            'userDocumentNumber' => $kyc?->document_number ?? 'N/A',
            'paymentType' => 'new',
            'healthDeclaration' => $buyRequest->health_declaration,
        ]);

        return $pdf->download("policy-{$policyNumber}.pdf");
    }

    public function paymentReceipt(BuyRequest $buyRequest)
    {
        $payment = $buyRequest->payments()->where('is_verified', true)->latest()->first();
        if (!$payment) {
            return response()->json(['message' => 'No verified payment found for this request'], 404);
        }

        $policy = $payment->policy ?? $buyRequest->policy;
        $user = $payment->user;
        $recipientEmail = $buyRequest->email ?? $user?->email;
        $billingCycle = $buyRequest->billing_cycle ?? 'yearly';
        $transactionId = $payment->provider_reference ?? ($payment->meta['transaction_uuid'] ?? (string) $payment->id);
        $tz = 'Asia/Kathmandu';
        $paidAt = \Illuminate\Support\Carbon::parse($payment->verified_at ?? $payment->paid_at ?? now())->timezone($tz);
        $receiptNumber = 'RCPT-' . str_pad((string) $payment->id, 6, '0', STR_PAD_LEFT);
        
        $firstPayment = $buyRequest->payments()->where('is_verified', true)->orderBy('created_at', 'asc')->first();
        $policyNumber = 'BS-' . str_pad((string) ($firstPayment?->id ?? $payment->id), 6, '0', STR_PAD_LEFT);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.payment-receipt', [
            'receiptNumber' => $receiptNumber,
            'policyNumber' => $policyNumber,
            'transactionId' => $transactionId,
            'amount' => $payment->amount ?? 0,
            'currency' => $payment->currency ?? 'NPR',
            'paidAt' => $paidAt,
            'paidAtText' => $paidAt->format('M j, Y g:i A') . " (NPT)",
            'policyName' => $policy?->policy_name ?? 'Policy',
            'companyName' => $policy?->company_name ?? 'Insurance Company',
            'billingCycle' => $billingCycle ?? 'yearly',
            'userName' => $user?->name ?? 'Customer',
            'userEmail' => $recipientEmail ?? 'N/A',
            'nextRenewalDate' => $buyRequest->next_renewal_date,
            'nextRenewalDateText' => $buyRequest->next_renewal_date ? \Illuminate\Support\Carbon::parse($buyRequest->next_renewal_date)->format('M j, Y') . " (NPT)" : null,
            'paymentType' => ($payment && $buyRequest->payments()->where('is_verified', true)->oldest()->first()?->id === $payment->id) ? 'new' : 'renewal',
        ]);

        return $pdf->download("receipt-{$receiptNumber}.pdf");
    }
}
