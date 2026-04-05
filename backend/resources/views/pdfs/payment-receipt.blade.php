<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>BeemaSathi Receipt - Modern</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Helvetica', 'Arial', sans-serif; color: #1a202c; background: #ffffff; line-height: 1.5; }
        .wrapper { width: 100%; max-width: 700px; margin: auto; padding: 30px; border: 1px solid #edf2f7; }
        
        /* Header */
        .header-table { width: 100%; border-bottom: 2px solid #0f2d52; padding-bottom: 20px; margin-bottom: 25px; border-collapse: collapse; }
        .brand-title { color: #0f2d52; font-size: 26px; font-weight: bold; margin: 0; }
        .brand-sub { color: #718096; font-size: 11px; margin: 2px 0 0; text-transform: uppercase; letter-spacing: 1px; }
        .receipt-heading { text-align: right; color: #0f2d52; font-size: 20px; font-weight: bold; vertical-align: top; }
        
        /* Summary Box */
        .summary-box { background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #e2e8f0; overflow: hidden; }
        .amount-label { font-size: 11px; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
        .amount-value { font-size: 28px; color: #0f2d52; font-weight: bold; }
        .status-pill { float: right; background: #def7ec; color: #03543f; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; }

        /* Data Table */
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .details-table th { background: #f1f5f9; text-align: left; padding: 10px 15px; font-size: 11px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
        .details-table td { padding: 14px 15px; font-size: 14px; border-bottom: 1px solid #f1f5f9; vertical-align: top; color: #4a5568; }
        .label { font-weight: bold; color: #1e293b; width: 35%; }
        .value { color: #4a5568; }
        .policy-num { font-family: monospace; font-weight: bold; color: #1a202c; font-size: 15px; }

        /* Highlighted Row */
        .renewal-row { background-color: #fffbeb; }
        .renewal-label { color: #92400e !important; }
        .renewal-value { font-weight: bold; color: #92400e !important; }

        /* Footer */
        .note { padding: 15px; border-left: 4px solid #e2e8f0; font-size: 12px; color: #718096; font-style: italic; margin-bottom: 40px;}
        .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <table class="header-table" cellpadding="0" cellspacing="0">
            <tr>
                <td>
                    <h1 class="brand-title">BeemaSathi</h1>
                    <p class="brand-sub">Smart Digital Insurance Companion</p>
                </td>
                <td class="receipt-heading">
                    PAYMENT RECEIPT<br>
                    <span style="font-size: 11px; color: #a0aec0; font-weight: normal;">TXN: {{ $transactionId }}</span>
                </td>
            </tr>
        </table>

        <p style="font-size: 15px; margin-bottom: 20px;">Hi <strong>{{ $userName ?? $name ?? 'Customer' }}</strong>, Your payment has been successfully processed.</p>

        <div class="summary-box">
            <div class="status-pill">Paid Successfully</div>
            <div class="amount-label">Total Amount Paid</div>
            <div class="amount-value">NPR {{ number_format((float) $amount, 2) }}</div>
        </div>

        <table class="details-table">
            <thead>
                <tr>
                    <th colspan="2">Transaction Details</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="label">Policy Name</td>
                    <td class="value">{{ $policyName }}</td>
                </tr>
                <tr>
                    <td class="label">Policy Number</td>
                    <td class="value policy-num">{{ $policyNumber }}</td>
                </tr>
                <tr>
                    <td class="label">Insurance Company</td>
                    <td class="value">{{ $companyName }}</td>
                </tr>
                <tr>
                    <td class="label">Payment Type</td>
                    <td class="value">{{ ucfirst($paymentType ?? 'new') }}</td>
                </tr>
                <tr>
                    <td class="label">Billing Cycle</td>
                    <td class="value">{{ ucfirst(str_replace('_', ' ', $billingCycle)) }}</td>
                </tr>
                <tr>
                    <td class="label">Payment Date</td>
                    <td class="value">{{ $paidAtText ?? (\Illuminate\Support\Carbon::parse($paidAt)->timezone('Asia/Kathmandu')->toDayDateTimeString().' (NPT)') }}</td>
                </tr>
                @if(!empty($nextRenewalDate))
                <tr class="renewal-row">
                    <td class="label renewal-label">Next Renewal</td>
                    <td class="value renewal-value">
                        {{ $nextRenewalDateText ?? (\Illuminate\Support\Carbon::parse($nextRenewalDate)->timezone('Asia/Kathmandu')->toDayDateTimeString().' (NPT)') }}
                    </td>
                </tr>
                @endif
                <tr>
                    <td class="label">Email Address</td>
                    <td class="value">{{ $userEmail ?? 'N/A' }}</td>
                </tr>
            </tbody>
        </table>

        <div class="note">
            Note: This is an electronically generated receipt. No physical signature is required. For any queries, please contact your insurance provider or BeemaSathi support.
        </div>

        <div class="footer">
            &copy; {{ date('Y') }} BeemaSathi. All rights reserved. <br>
            Secure Insurance Payments
        </div>
    </div>
</body>
</html>