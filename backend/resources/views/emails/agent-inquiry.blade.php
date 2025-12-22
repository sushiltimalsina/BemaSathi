<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, sans-serif; color:#111;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto;">
    <tr>
      <td style="background:#0f2d52; padding:20px 30px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:24px;">BeemaSathi</h1>
        <p style="margin:6px 0 0; color:#cfe0ff; font-size:12px;">Agent Inquiry Notification</p>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff; padding:28px 30px;">
        <p style="margin:0 0 12px; font-size:16px;">Hi <strong>{{ $agentName ?? 'Agent' }}</strong>,</p>
        <p style="margin:0 0 16px; font-size:14px; line-height:1.6;">
          A client has requested details about a policy you handle. Please reach out to them.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:16px;">
          <tr>
            <td style="padding:8px 0; font-size:14px;"><strong>Client</strong></td>
            <td style="padding:8px 0; font-size:14px;">{{ $clientName ?? 'N/A' }}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-size:14px;"><strong>Email</strong></td>
            <td style="padding:8px 0; font-size:14px;">{{ $clientEmail ?? 'N/A' }}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-size:14px;"><strong>Policy</strong></td>
            <td style="padding:8px 0; font-size:14px;">{{ $policyName ?? 'N/A' }}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-size:14px;"><strong>Company</strong></td>
            <td style="padding:8px 0; font-size:14px;">{{ $companyName ?? 'N/A' }}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-size:14px;"><strong>Premium</strong></td>
            <td style="padding:8px 0; font-size:14px;">NPR {{ number_format((float) ($premiumAmount ?? 0), 2) }}</td>
          </tr>
          <tr>
            <td style="padding:8px 0; font-size:14px;"><strong>Coverage</strong></td>
            <td style="padding:8px 0; font-size:14px;">{{ $coverageLimit ?? 'N/A' }}</td>
          </tr>
        </table>
        <p style="margin:0; font-size:14px; line-height:1.6;">
          Please respond promptly to assist the client.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:18px; text-align:center; font-size:12px; color:#6b7280;">
        &copy; {{ date('Y') }} BeemaSathi. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
