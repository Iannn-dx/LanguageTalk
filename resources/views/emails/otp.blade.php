<!DOCTYPE html>
<html>
<head>
    <title>Email Verification - sample</title>
</head>
<body>
    <h2>Verify Your Email Address</h2>

    <p>Thank you for registering!</p>

    <p>Your verification code is:</p>

    <h1 style="letter-spacing: 8px;">
        {{ $otp }}
    </h1>

    <p>This code expires in 5 minutes.</p>

    <p>If you did not create an account, you can ignore this email.</p>
</body>
</html>