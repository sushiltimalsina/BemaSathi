%<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to BemaSathi</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                🏢 Welcome to BemaSathi
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">
                                Your Company Registration is Complete
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                Dear <strong>{{ $company->name }}</strong>,
                            </p>

                            <p style="margin: 0 0 20px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                                Congratulations! Your company has been successfully registered on the <strong>BemaSathi</strong> insurance platform.
                            </p>

                            <p style="margin: 0 0 30px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                                You can now offer insurance policies through our platform and reach thousands of potential customers across Nepal.
                            </p>

                            <!-- Company Details Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; border-left: 4px solid #667eea; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 16px; font-weight: 600;">
                                            📋 Company Details
                                        </h3>
                                        <table width="100%" cellpadding="5" cellspacing="0">
                                            <tr>
                                                <td style="color: #666666; font-size: 14px; width: 40%;">Company Name:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600;">{{ $company->name }}</td>
                                            </tr>
                                            <tr>
                                                <td style="color: #666666; font-size: 14px;">Email:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600;">{{ $company->email }}</td>
                                            </tr>
                                            @if($company->phone)
                                            <tr>
                                                <td style="color: #666666; font-size: 14px;">Phone:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600;">{{ $company->phone }}</td>
                                            </tr>
                                            @endif
                                            @if($company->address)
                                            <tr>
                                                <td style="color: #666666; font-size: 14px;">Address:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600;">{{ $company->address }}</td>
                                            </tr>
                                            @endif
                                            <tr>
                                                <td style="color: #666666; font-size: 14px;">Registration Date:</td>
                                                <td style="color: #333333; font-size: 14px; font-weight: 600;">{{ $company->created_at->format('F d, Y') }}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Next Steps -->
                            <h3 style="margin: 0 0 15px 0; color: #333333; font-size: 18px; font-weight: 600;">
                                🚀 Next Steps
                            </h3>
                            <ul style="margin: 0 0 30px 0; padding-left: 20px; color: #555555; font-size: 15px; line-height: 1.8;">
                                <li>Our admin team will contact you shortly to complete the onboarding process</li>
                                <li>You can start adding agents to manage your policies</li>
                                <li>Create and publish insurance policies for customers</li>
                                <li>Monitor policy sales and customer inquiries through our platform</li>
                            </ul>

                            <!-- Support Info -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107; margin-bottom: 20px;">
                                <tr>
                                    <td style="padding: 15px;">
                                        <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">
                                            <strong>💡 Need Help?</strong><br>
                                            If you have any questions or need assistance, please contact our support team at <a href="mailto:support@bemasathi.com" style="color: #667eea; text-decoration: none;">support@bemasathi.com</a>
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 0 0 10px 0; color: #555555; font-size: 15px; line-height: 1.6;">
                                Thank you for partnering with BemaSathi!
                            </p>

                            <p style="margin: 0; color: #555555; font-size: 15px; line-height: 1.6;">
                                Best regards,<br>
                                <strong>The BemaSathi Team</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                            <p style="margin: 0 0 10px 0; color: #666666; font-size: 13px;">
                                BemaSathi - Your Trusted Insurance Partner
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 12px;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
