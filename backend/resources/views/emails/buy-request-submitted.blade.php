<!DOCTYPE html>
<html lang="en">
<body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, sans-serif; color:#111;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto;">
    <tr>
      <td style="background:#0f2d52; padding:20px 30px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:24px;">BemaSathi</h1>
        <p style="margin:6px 0 0; color:#cfe0ff; font-size:12px;">Smart Digital Insurance Companion</p>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff; padding:28px 30px;">
        <p style="margin:0 0 12px; font-size:16px;">Hi <strong>{{ $userName ?? 'there' }}</strong>,</p>
        <p style="margin:0 0 12px; font-size:14px; line-height:1.6;">
          Your buy request has been submitted successfully. Our team will verify your payment next.
        </p>
        @if(!empty($policyName))
        <p style="margin:0 0 12px; font-size:14px;">
          <strong>Policy:</strong> {{ $policyName }}
        </p>
        @endif
        <p style="margin:0 0 12px; font-size:14px; line-height:1.6;">
          After payment verification, you will receive your policy document via email.
        </p>
        <p style="margin:0; font-size:14px; line-height:1.6;">
          Proceed to payment: <a href="{{ $paymentUrl }}" style="color:#0f62fe;">Pay Now</a>
        </p>
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
