<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
    .header { border-bottom: 2px solid #0f2d52; padding-bottom: 10px; margin-bottom: 16px; }
    .brand { font-size: 20px; font-weight: bold; color: #0f2d52; }
    .tagline { font-size: 11px; color: #4b5563; }
    .muted { color: #4b5563; }
    .section-title { font-size: 14px; font-weight: bold; margin: 16px 0 6px; color: #0f2d52; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 6px 0; vertical-align: top; }
    .label { font-weight: bold; width: 160px; }
    .terms { font-size: 11px; color: #374151; }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">{{ $companyName ?? 'Insurance Company' }}</div>
    <div class="tagline">Policy Document</div>
    <div class="tagline">Issued via BeemaSathi</div>
  </div>

  <div class="section-title">Policy Details</div>
  <table>
    <tr><td class="label">Policy number</td><td>{{ $policyNumber }}</td></tr>
    <tr><td class="label">Policy name</td><td>{{ $policyName }}</td></tr>
    <tr><td class="label">Company</td><td>{{ $companyName }}</td></tr>
    <tr><td class="label">Insurance type</td><td>{{ $insuranceType ?? 'N/A' }}</td></tr>
    <tr><td class="label">Coverage limit</td><td>{{ $coverageLimit }}</td></tr>
    <tr><td class="label">Premium</td><td>NPR {{ number_format((float) $premium, 2) }}</td></tr>
    <tr><td class="label">Billing cycle</td><td>{{ ucfirst(str_replace('_', ' ', $billingCycle)) }}</td></tr>
    <tr><td class="label">Effective date</td><td>{{ \Illuminate\Support\Carbon::parse($effectiveDate)->toFormattedDateString() }}</td></tr>
    @if(!empty($nextRenewalDate))
    <tr><td class="label">Next renewal date</td><td>{{ \Illuminate\Support\Carbon::parse($nextRenewalDate)->toFormattedDateString() }}</td></tr>
    @endif
  </table>

  <div class="section-title">Policy Holder</div>
  <table>
    <tr><td class="label">Name</td><td>{{ $userName }}</td></tr>
    <tr><td class="label">Email</td><td>{{ $userEmail }}</td></tr>
  </table>

  <div class="section-title">Plan Information</div>
  <table>
    <tr>
      <td class="label">Covered conditions</td>
      <td>
        @if(!empty($coveredConditions) && is_array($coveredConditions))
          {{ implode(', ', $coveredConditions) }}
        @else
          N/A
        @endif
      </td>
    </tr>
    <tr>
      <td class="label">Exclusions</td>
      <td>
        @if(!empty($exclusions) && is_array($exclusions))
          {{ implode(', ', $exclusions) }}
        @else
          N/A
        @endif
      </td>
    </tr>
    <tr><td class="label">Waiting period</td><td>{{ $waitingPeriodDays ? $waitingPeriodDays . ' days' : 'N/A' }}</td></tr>
    <tr><td class="label">Co-pay</td><td>{{ $copayPercent !== null ? $copayPercent . '%' : 'N/A' }}</td></tr>
    <tr><td class="label">Claim settlement ratio</td><td>{{ $claimSettlementRatio !== null ? $claimSettlementRatio . '%' : 'N/A' }}</td></tr>
    <tr><td class="label">Smoker coverage</td><td>{{ $supportsSmokers ? 'Supported' : 'Not supported' }}</td></tr>
  </table>

  <div class="section-title">Terms and Conditions</div>
  <div class="terms">
    @if(!empty($policyDescription))
      <p class="muted">{{ $policyDescription }}</p>
    @else
      <p>Coverage is subject to underwriting guidelines and exclusions defined by the insurer.</p>
      <p>Premiums are payable according to the chosen billing cycle to keep the policy active.</p>
      <p>Claims are processed as per the insurer's claim settlement policy.</p>
      <p>This document is issued as a digital policy summary for your records.</p>
    @endif
  </div>
</body>
</html>
