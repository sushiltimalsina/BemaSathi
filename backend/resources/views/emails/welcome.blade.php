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
          Welcome to BeemaSathi! To get started and access your dashboard, please verify your email address by clicking the button below.
        </p>
        <div style="text-align:center; margin:24px 0;">
          <a href="{{ $verifyUrl }}" style="background:#0f62fe; color:#ffffff; padding:12px 30px; text-decoration:none; border-radius:8px; font-weight:bold; display:inline-block;">Verify Email Address</a>
        </div>
        <p style="margin:0 0 16px; font-size:13px; color:#6b7280; line-height:1.6;">
          Once verified, you can complete your profile and KYC to unlock policy purchases.
        </p>
        <p style="margin:0 0 8px; font-size:14px; font-weight:bold;">Next steps</p>
        <ul style="margin:0 0 16px 18px; padding:0; font-size:14px; line-height:1.6;">
          <li>Complete your KYC: <a href="{{ $kycUrl }}" style="color:#0f62fe;">Start KYC</a></li>
          <li>Update your profile: <a href="{{ $profileUrl }}" style="color:#0f62fe;">My Profile</a></li>
          <li>Browse policies: <a href="{{ $policiesUrl }}" style="color:#0f62fe;">Explore Policies</a></li>
        </ul>
        <p style="margin:0; font-size:14px; line-height:1.6;">We are here if you need any help.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:18px; text-align:center; font-size:12px; color:#6b7280;">
        &copy; {{ date('Y') }} BemaSathi. All rights reserved.
      </td>
    </tr>
  </table>
</body>
</html>
