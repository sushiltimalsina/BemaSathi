<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; font-family: 'Helvetica', 'Arial', sans-serif; color: #333; background: #fff; line-height: 1.5; }
        .container { width: 100%; max-width: 800px; margin: auto; padding: 40px; }
        
        /* Header Section */
        .header-table { width: 100%; border-bottom: 2px solid #0f2d52; padding-bottom: 20px; margin-bottom: 30px; }
        .brand-name { color: #0f2d52; font-size: 28px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
        .brand-sub { color: #6b7280; font-size: 12px; margin: 0; }
        .receipt-label { text-align: right; color: #0f2d52; font-size: 24px; font-weight: bold; margin: 0; }
        
        /* Summary Box */
        .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 30px; }
        .amount-highlight { font-size: 22px; color: #0f2d52; font-weight: bold; }
        
        /* Info Table */
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
        .details-table th { text-align: left; padding: 12px 10px; border-bottom: 1px solid #e2e8f0; color: #64748b; font-size: 12px; text-transform: uppercase; }
        .details-table td { padding: 15px 10px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #1e293b; }
        .label { font-weight: bold; color: #475569; width: 35%; }
        
        /* Footer */
        .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 50px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        .status-badge { background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: bold; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <table class="header-table" cellspacing="0" cellpadding="0">
            <tr>
                <td>
                    <h1 class="brand-name">BeemaSathi</h1>
                    <p class="brand-sub">Smart Digital Insurance Companion</p>
                </td>
                <td class="receipt-label">
                    PAYMENT RECEIPT<br>
                    <span style="font-size: 12px; color: #64748b; font-weight: normal;">ID: {{ $transactionId }}</span>
                </td>
            </tr>
        </table>

        <p style="font-size: 15px;">Dear <strong>{{ $userName ?? $name ?? 'Customer' }}</strong>,</p>
        <p style="font-size: 14px; color: #4b5563;">Thank you for your trust in <strong>BeemaSathi</strong>. Your payment for the following policy has been successfully processed.</p>

        <div class="summary-card">
            <table width="100%">
                <tr>
                    <td>
                        <span style="font-size: 12px; color: #64748b; display: block;">TOTAL AMOUNT PAID</span>
                        <span class="amount-highlight">NPR {{ number_format((float) $amount, 2) }}</span>
                    </td>
                    <td style="text-align: right;">
                        <span class="status-badge">PAID SUCCESSFUL</span>
                    </td>
                </tr>
            </table>
        </div>

        <table class="details-table">
            <thead>
                <tr>
                    <th colspan="2">Policy & Transaction Information</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label">Policy Name</td>
                    <td>{{ $policyName }}</td>
                </tr>
                <tr>
                    <td class="label">Policy Number</td>
                    <td style="font-family: monospace; font-size: 15px;">{{ $policyNumber }}</td>
                </tr>
                <tr>
                    <td class="label">Insurance Company</td>
                    <td>{{ $companyName }}</td>
                </tr>
                <tr>
                    <td class="label">Payment Type</td>
                    <td>{{ ucfirst($paymentType ?? 'New Purchase') }}</td>
                </tr>
                <tr>
                    <td class="label">Billing Cycle</td>
                    <td>{{ ucfirst(str_replace('_', ' ', $billingCycle)) }}</td>
                </tr>
                <tr>
                    <td class="label">Transaction Date</td>
                    <td>{{ $paidAtText ?? (\Illuminate\Support\Carbon::parse($paidAt)->timezone('Asia/Kathmandu')->toDayDateTimeString().' (NPT)') }}</td>
                </tr>
                @if(!empty($nextRenewalDate))
                <tr style="background-color: #fefce8;">
                    <td class="label">Next Renewal Date</td>
                    <td style="font-weight: bold; color: #854d0e;">
                        {{ $nextRenewalDateText ?? (\Illuminate\Support\Carbon::parse($nextRenewalDate)->timezone('Asia/Kathmandu')->toDayDateTimeString().' (NPT)') }}
                    </td>
                </tr>
                @endif
                <tr>
                    <td class="label">Email Address</td>
                    <td>{{ $userEmail ?? 'N/A' }}</td>
                </tr>
            </tbody>
        </table>

        <div style="margin-top: 20px; font-size: 13px; color: #475569;">
            <p><strong>Note:</strong> This is a computer-generated receipt and does not require a physical signature. Please keep this for your records.</p>
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} BeemaSathi. All rights reserved.<br>
            Helping you secure your future, one policy at a time.
        </div>
    </div>
</body>
</html>