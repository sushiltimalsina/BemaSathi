<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
    .header { border-bottom: 2px solid #0f2d52; padding-bottom: 10px; margin-bottom: 16px; }
    .brand { font-size: 20px; font-weight: bold; color: #0f2d52; }
    .tagline { font-size: 11px; color: #4b5563; }
    .section-title { font-size: 14px; font-weight: bold; margin: 16px 0 6px; color: #0f2d52; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 0; vertical-align: top; }
    .label { font-weight: bold; width: 160px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">BemaSathi</div>
    <div class="tagline">Payment Receipt</div>
  </div>

  <div class="section-title">Receipt Details</div>
  <table>
    <tr><td class="label">Receipt number</td><td>{{ $receiptNumber }}</td></tr>
    <tr><td class="label">Policy number</td><td>{{ $policyNumber }}</td></tr>
    <tr><td class="label">Transaction ID</td><td>{{ $transactionId }}</td></tr>
    <tr><td class="label">Amount</td><td>{{ $currency }} {{ number_format((float) $amount, 2) }}</td></tr>
    <tr><td class="label">Paid at</td><td>{{ \Illuminate\Support\Carbon::parse($paidAt)->toDayDateTimeString() }}</td></tr>
  </table>

  <div class="section-title">Policy Details</div>
  <table>
    <tr><td class="label">Policy</td><td>{{ $policyName }}</td></tr>
    <tr><td class="label">Company</td><td>{{ $companyName }}</td></tr>
    <tr><td class="label">Billing cycle</td><td>{{ ucfirst(str_replace('_', ' ', $billingCycle)) }}</td></tr>
    @if(!empty($nextRenewalDate))
    <tr>
      <td class="label">Next renewal</td>
      <td>{{ \Illuminate\Support\Carbon::parse($nextRenewalDate)->toDayDateTimeString() }}</td>
    </tr>
    @endif
  </table>

  <div class="section-title">Payer</div>
  <table>
    <tr><td class="label">Name</td><td>{{ $userName }}</td></tr>
    <tr><td class="label">Email</td><td>{{ $userEmail }}</td></tr>
  </table>
</body>
</html>
