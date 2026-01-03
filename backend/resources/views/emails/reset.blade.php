<!DOCTYPE html>
<html lang="en">

<body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, sans-serif; color:#1a1a1a;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto;">

    <!-- HEADER -->
    <tr>
      <td style="background:#2563EB; padding:20px 30px; text-align:center; border-radius:0 0 8px 8px;">
        <h1 style="margin:0; color:#ffffff; font-size:24px; letter-spacing:0.5px;">BeemaSathi</h1>
        <p style="margin:5px 0 0; color:#dbe9ff; font-size:13px;">Smart Digital Insurance Companion</p>
      </td>
    </tr>

    <!-- MAIN CARD -->
    <tr>
      <td style="background:#ffffff; padding:30px; border-radius:8px; margin-top:20px; box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <p style="font-size:16px; margin:0 0 15px;">
          Hi <strong>{{ $name ?? 'there' }}</strong>,
        </p>

        <p style="font-size:14px; line-height:1.6; margin:0 0 20px;">
          We received a request to reset your BemaSathi account password.
          You can reset it using the verification code below or by clicking the secure link.
        </p>

        <!-- OTP BOX -->
        <div style="
          background:#f0f4ff;
          border:1px solid #c7d7ff;
          padding:14px;
          font-size:22px;
          font-weight:bold;
          letter-spacing:4px;
          text-align:center;
          color:#2563EB;
          border-radius:6px;
          margin-bottom:25px;
        ">
          {{ $token }}
        </div>

        <!-- RESET LINK BUTTON -->
        <a href="{{ $resetLink }}"
           style="
             display:inline-block;
             background:#2563EB;
             padding:12px 22px;
             color:white;
             text-decoration:none;
             font-size:15px;
             font-weight:bold;
             border-radius:6px;
             margin-bottom:20px;
           ">
          Reset Password
        </a>

        <p style="font-size:12px; margin:0 0 25px; color:#6b7280;">
          If the button doesn't work, copy and paste this link in your browser:<br>
          <span style="color:#2563EB; word-break:break-all;">{{ $resetLink }}</span>
        </p>

        <p style="font-size:13px; margin:0; line-height:1.5; color:#444;">
          If you didn’t request this password reset, you can safely ignore this message.
          Your account will remain secure.
        </p>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="padding:20px; text-align:center; font-size:12px; color:#6b7280;">
        © {{ date('Y') }} BemaSathi · All rights reserved
        <br>Smart Insurance Comparison Made Simple
      </td>
    </tr>

  </table>
</body>
</html>
