<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome Agent</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
        .header { background: #f8f9fa; padding: 15px; text-align: center; border-bottom: 1px solid #eee; }
        .content { padding: 20px 0; }
        .footer { font-size: 12px; color: #777; margin-top: 20px; text-align: center; }
        .button { display: inline-block; background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Welcome to BeemaSathi</h2>
        </div>
        <div class="content">
            <p>Dear {{ $agent->name }},</p>
            <p>Congratulations! You have been successfully registered as an official agent with BeemaSathi.</p>
            
            <p>Your official email for communication is:</p>
            <ul>
                <li><strong>Email:</strong> {{ $agent->email }}</li>
            </ul>

            <p>You have been added to our system. The administration will contact you regarding policy management and lead assignments.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} BeemaSathi. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
