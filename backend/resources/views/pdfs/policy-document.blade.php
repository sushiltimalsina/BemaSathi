<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">

<style>
  body {
    font-family: DejaVu Sans, Arial, sans-serif;
    font-size: 12px;
    color: #111827;
    line-height: 1.6;
  }

  :root {
    --brand: {{ $brandColor ?? '#0f2d52' }};
    --muted: #6b7280;
    --border: #e5e7eb;
  }

  /* ---------- HEADER ---------- */
  .letterhead {
    border-bottom: 3px solid var(--brand);
    padding-bottom: 14px;
    margin-bottom: 24px;
  }

  .company-name {
    font-size: 22px;
    font-weight: 700;
    color: var(--brand);
  }

  .document-type {
    font-size: 12px;
    color: var(--muted);
    margin-top: 2px;
  }

  .issued-via {
    font-size: 11px;
    color: var(--muted);
  }

  /* ---------- SECTIONS ---------- */
  .section {
    margin-bottom: 22px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--brand);
    border-bottom: 1px solid var(--border);
    padding-bottom: 6px;
    margin-bottom: 10px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  td {
    padding: 6px 0;
    vertical-align: top;
  }

  .label {
    width: 180px;
    font-weight: 600;
    color: #374151;
  }

  .value {
    color: #111827;
  }

  /* ---------- HIGHLIGHT BOX ---------- */
  .summary-box {
    background: #f9fafb;
    border-left: 4px solid var(--brand);
    padding: 12px 14px;
    margin-bottom: 22px;
  }

  /* ---------- TERMS ---------- */
  .terms {
    font-size: 11px;
    color: #374151;
  }

  /* ---------- FOOTER ---------- */
  .footer {
    margin-top: 30px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    font-size: 10px;
    color: var(--muted);
  }
</style>
</head>

<body>

<!-- LETTERHEAD -->
<div class="letterhead">
  <div class="company-name">{{ $companyName ?? 'Insurance Company' }}</div>
  <div class="document-type">Official Policy Document</div>
  <div class="issued-via">Issued digitally via BeemaSathi</div>
</div>

<!-- POLICY SUMMARY -->
<div class="summary-box">
  <strong>Policy Number:</strong> {{ $policyNumber }} <br>
  <strong>Effective Date:</strong>
  {{ \Illuminate\Support\Carbon::parse($effectiveDate)->toFormattedDateString() }}
</div>

<!-- POLICY DETAILS -->
<div class="section">
  <div class="section-title">Policy Details</div>
  <table>
    <tr><td class="label">Policy Name</td><td class="value">{{ $policyName }}</td></tr>
    <tr><td class="label">Insurance Type</td><td class="value">{{ $insuranceType ?? 'N/A' }}</td></tr>
    <tr><td class="label">Coverage Limit</td><td class="value">{{ $coverageLimit }}</td></tr>
    <tr><td class="label">Premium</td><td class="value">NPR {{ number_format((float) $premium, 2) }}</td></tr>
    <tr><td class="label">Billing Cycle</td><td class="value">{{ ucfirst(str_replace('_', ' ', $billingCycle)) }}</td></tr>

    @if(!empty($nextRenewalDate))
    <tr>
      <td class="label">Next Renewal</td>
      <td class="value">
        {{ \Illuminate\Support\Carbon::parse($nextRenewalDate)->toFormattedDateString() }}
      </td>
    </tr>
    @endif
  </table>
</div>

<!-- POLICY HOLDER -->
<div class="section">
  <div class="section-title">Policy Holder Details</div>
  <table>
    <tr><td class="label">Name</td><td class="value">{{ $userName }}</td></tr>
    <tr><td class="label">Email</td><td class="value">{{ $userEmail }}</td></tr>
    <tr><td class="label">Phone</td><td class="value">{{ $userPhone ?? 'N/A' }}</td></tr>
    <tr><td class="label">Address</td><td class="value">{{ $userAddress ?? 'N/A' }}</td></tr>
    <tr><td class="label">Date of Birth</td><td class="value">{{ $userDob ? \Illuminate\Support\Carbon::parse($userDob)->toFormattedDateString() : 'N/A' }}</td></tr>
    <tr><td class="label">Occupation Class</td><td class="value">{{ ucfirst(str_replace('_', ' ', $userOccupation ?? 'Class 1')) }}</td></tr>
    <tr><td class="label">BMI / Smoker Status</td><td class="value">{{ $userBmi ?? 'N/A' }} / {{ $userSmoker ? 'Smoker' : 'Non-Smoker' }}</td></tr>
  </table>
</div>

<!-- PLAN INFORMATION -->
<div class="section">
  <div class="section-title">Plan Information</div>
  <table>
    <tr>
      <td class="label">Covered Conditions</td>
      <td class="value">
        {{ !empty($coveredConditions) ? implode(', ', $coveredConditions) : 'N/A' }}
      </td>
    </tr>
    <tr>
      <td class="label">Exclusions</td>
      <td class="value">
        {{ !empty($exclusions) ? implode(', ', $exclusions) : 'N/A' }}
      </td>
    </tr>
    <tr><td class="label">Waiting Period</td><td class="value">{{ $waitingPeriodDays ? $waitingPeriodDays.' days' : 'N/A' }}</td></tr>
    <tr><td class="label">Co-pay</td><td class="value">{{ $copayPercent !== null ? $copayPercent.'%' : 'N/A' }}</td></tr>
    <tr><td class="label">Claim Settlement Ratio</td><td class="value">{{ $claimSettlementRatio !== null ? $claimSettlementRatio.'%' : 'N/A' }}</td></tr>
    <tr><td class="label">Smoker Coverage</td><td class="value">{{ $supportsSmokers ? 'Supported' : 'Not Supported' }}</td></tr>
  </table>
</div>

<!-- HEALTH DECLARATION -->
@if(!empty($healthDeclaration))
<div class="section">
  <div class="section-title">Health Declaration</div>
  <table>
    @if(!empty($healthDeclaration['selectedConditions']))
    <tr>
      <td class="label">Personal Conditions</td>
      <td class="value">
        {{ implode(', ', array_map('ucfirst', $healthDeclaration['selectedConditions'])) }}
      </td>
    </tr>
    @endif

    @if(!empty($healthDeclaration['familyConditions']))
    <tr>
      <td class="label">Family Conditions</td>
      <td class="value">
        {{ implode(', ', array_map('ucfirst', $healthDeclaration['familyConditions'])) }}
      </td>
    </tr>
    @endif

    @if(!empty($healthDeclaration['generalAnswers']))
      @foreach($healthDeclaration['generalAnswers'] as $key => $val)
        @if($val === 'yes' || (is_string($val) && strlen($val) > 3))
          <tr>
            <td class="label">{{ ucfirst(str_replace('_', ' ', $key)) }}</td>
            <td class="value">
              @if($val === 'yes') <span style="color: #059669; font-weight: bold;">Yes</span> 
              @elseif($val === 'no') <span style="color: #6b7280;">No</span>
              @else {{ ucfirst($val) }} @endif
            </td>
          </tr>
        @endif
      @endforeach
    @endif

    @if(!empty($healthDeclaration['finalDeclaration']['signature']))
    <tr>
      <td class="label">Digitally Signed By</td>
      <td class="value"><strong>{{ $healthDeclaration['finalDeclaration']['signature'] }}</strong></td>
    </tr>
    @endif
  </table>
</div>
@endif

<!-- TERMS -->
<div class="section">
  <div class="section-title">Terms & Conditions</div>
  <div class="terms">
    {{ $policyDescription ?? 'Coverage is subject to underwriting guidelines, exclusions, and claim policies defined by the insurer. Premiums must be paid on time to keep the policy active. This is a digitally issued policy summary.' }}
  </div>
</div>

<!-- FOOTER -->
<div class="footer">
  This document is electronically generated and does not require a physical signature.<br>
  © {{ date('Y') }} {{ $companyName }} • Issued via BemaSathi
</div>

</body>
</html>
