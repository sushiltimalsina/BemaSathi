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
    .terms { font-size: 11px; color: #374151; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">BeemaSathi</div>
    <div class="tagline">Policy Document</div>
  </div>

  <div class="section-title">Policy Details</div>
  <table>
    <tr><td class="label">Policy number</td><td>{{ $policyNumber }}</td></tr>
    <tr><td class="label">Policy name</td><td>{{ $policyName }}</td></tr>
    <tr><td class="label">Company</td><td>{{ $companyName }}</td></tr>
    <tr><td class="label">Coverage limit</td><td>{{ $coverageLimit }}</td></tr>
    <tr><td class="label">Premium</td><td>NPR {{ number_format((float) $premium, 2) }}</td></tr>
    <tr><td class="label">Billing cycle</td><td>{{ ucfirst(str_replace('_', ' ', $billingCycle)) }}</td></tr>
    <tr><td class="label">Effective date</td><td>{{ \Illuminate\Support\Carbon::parse($effectiveDate)->toFormattedDateString() }}</td></tr>
  </table>

  <div class="section-title">Policy Holder</div>
  <table>
    <tr><td class="label">Name</td><td>{{ $userName }}</td></tr>
    <tr><td class="label">Email</td><td>{{ $userEmail }}</td></tr>
  </table>

  <div class="section-title">Terms and Conditions</div>
  <div class="terms">
    <p>1. Coverage is subject to underwriting guidelines and exclusions defined by the insurer.</p>
    <p>2. Premiums are payable according to the chosen billing cycle to keep the policy active.</p>
    <p>3. Claims are processed as per the insurer's claim settlement policy.</p>
    <p>4. This document is issued by BeemaSathi as a digital policy summary for your records.</p>
  </div>
</body>
</html>
