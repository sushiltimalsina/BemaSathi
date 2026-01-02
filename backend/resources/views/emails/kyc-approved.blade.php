<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, sans-serif; color:#111;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto;">
    <tr>
      <td style="background:#0f2d52; padding:20px 30px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:24px;">BeemaSathi</h1>
        <p style="margin:6px 0 0; color:#cfe0ff; font-size:12px;">Smart Digital Insurance Companion</p>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff; padding:28px 30px;">
        <p style="margin:0 0 12px; font-size:16px;">Hi <strong>{{ $name ?? 'there' }}</strong>,</p>
        <p style="margin:0 0 16px; font-size:14px; line-height:1.6;">
          Your KYC documents have been approved. You can now explore available policies and submit a buy request.
        </p>
        <p style="margin:0 0 8px; font-size:14px; font-weight:bold;">Next steps</p>
        <ul style="margin:0 0 16px 18px; padding:0; font-size:14px; line-height:1.6;">
          <li>Explore policies: <a href="{{ $policiesUrl }}" style="color:#0f62fe;">Browse Policies</a></li>
          <li>Select a policy and submit your buy request.</li>
        </ul>
        <p style="margin:0; font-size:14px; line-height:1.6;">Thank you for completing verification.</p>
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
