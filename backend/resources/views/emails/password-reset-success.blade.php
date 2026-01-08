<!DOCTYPE html>
<html lang="en">
  <body style="margin:0; padding:0; background:#f5f7fb; font-family: Arial, sans-serif; color:#111;">
    <!-- Preheader (hidden in email body, shown in inbox preview in many clients) -->
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      Your BeemaSathi password was changed.
    </div>

    <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; padding:24px 12px;">
      <tr>
        <td style="padding:0;">
          <!-- Outer card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 30px rgba(17, 24, 39, 0.08);">
            <!-- Header -->
            <tr>
              <td style="background:#0f2d52; padding:22px 28px; text-align:center;">
                <h1 style="margin:0; color:#ffffff; font-size:22px; letter-spacing:0.2px;">BeemaSathi</h1>
                <p style="margin:6px 0 0; color:#cfe0ff; font-size:12px; line-height:1.4;">
                  Smart Digital Insurance Companion
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px 28px 10px;">
                <p style="margin:0 0 12px; font-size:16px; line-height:1.5;">
                  Hi <strong>{{ $name ?? 'there' }}</strong>,
                </p>

                <p style="margin:0 0 16px; font-size:14px; line-height:1.7; color:#111827;">
                  Your BeemaSathi account password was successfully changed on
                  <strong style="color:#0f2d52;">
                    {{ $resetAtText }}{{ isset($timezoneLabel) ? " ({$timezoneLabel})" : "" }}
                  </strong>.
                </p>

                <!-- Info box -->
                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate; border-spacing:0; background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px; margin:0 0 18px;">
                  <tr>
                    <td style="padding:14px 14px 12px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                        <tr>
                          <td style="padding:0 0 8px; font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.4px;">
                            Account
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0; font-size:14px; color:#111827;">
                            {{ $email }}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 12px; font-size:14px; line-height:1.7; color:#111827;">
                  If you made this change, you can log in to your account:
                </p>

                <!-- CTA button -->
                <table cellpadding="0" cellspacing="0" border="0" style="margin:0 0 10px;">
                  <tr>
                    <td align="center" style="background:#0f62fe; border-radius:10px;">
                      <a
                        href="{{ $loginUrl }}"
                        style="display:inline-block; padding:12px 18px; font-size:14px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:10px;"
                        target="_blank"
                        rel="noopener"
                      >
                        Login to BeemaSathi
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- Link fallback -->
                <p style="margin:0 0 18px; font-size:12px; line-height:1.6; color:#6b7280;">
                  If the button doesn’t work, copy and paste this link into your browser:<br />
                  <a href="{{ $loginUrl }}" style="color:#0f62fe; text-decoration:underline; word-break:break-all;">
                    {{ $loginUrl }}
                  </a>
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0 0 14px;">
                  <tr>
                    <td style="border-top:1px solid #e5e7eb; padding-top:14px;"></td>
                  </tr>
                </table>

                <p style="margin:0 0 14px; font-size:13px; line-height:1.7; color:#374151;">
                  If you did not request this change, please contact support immediately.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 18px 20px; text-align:center; font-size:12px; color:#6b7280; background:#fbfdff;">
                <p style="margin:0; line-height:1.6;">
                  &copy; {{ date('Y') }} BeemaSathi. All rights reserved.
                </p>
              </td>
            </tr>
          </table>

          <!-- Small spacing -->
          <div style="height:18px; line-height:18px;">&nbsp;</div>

          <!-- Footer note outside card (optional) -->
          <p style="margin:0; text-align:center; font-size:11px; color:#9ca3af; line-height:1.6;">
            This is an automated message. Please do not reply.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
