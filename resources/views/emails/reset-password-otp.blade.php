<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password OTP</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #059669 0%, #10b981 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 1px;
        }
        .header p {
            color: rgba(255, 255, 255, 0.9);
            margin: 10px 0 0;
            font-size: 14px;
        }
        .content {
            padding: 40px 30px;
        }
        .content h2 {
            color: #1f2937;
            font-size: 24px;
            margin: 0 0 20px;
        }
        .content p {
            color: #6b7280;
            font-size: 15px;
            margin: 0 0 20px;
        }
        .otp-box {
            background: linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%);
            border: 2px solid #059669;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .otp-code {
            font-size: 42px;
            font-weight: bold;
            color: #059669;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        .otp-label {
            font-size: 13px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            margin-bottom: 5px;
        }
        .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 25px 0;
            border-radius: 6px;
        }
        .warning p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
        }
        .info-list {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px 25px;
            margin: 20px 0;
        }
        .info-list li {
            color: #4b5563;
            font-size: 14px;
            margin: 10px 0;
            padding-left: 10px;
        }
        .footer {
            background: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            color: #9ca3af;
            font-size: 13px;
            margin: 5px 0;
        }
        .footer strong {
            color: #059669;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ATHLEON</h1>
            <p>Your Sports Partner</p>
        </div>

        <div class="content">
            <h2>Reset Password</h2>
            <p>Halo!</p>
            <p>Anda menerima email ini karena kami menerima permintaan reset password untuk akun Anda.</p>

            <div class="otp-box">
                <div class="otp-label">Kode Verifikasi OTP</div>
                <div class="otp-code">{{ $otp }}</div>
                <p style="margin: 15px 0 0; color: #6b7280; font-size: 13px;">
                    Berlaku selama {{ $expiryMinutes }} menit
                </p>
            </div>

            <div class="info-list">
                <p style="margin: 0 0 10px; font-weight: 600; color: #1f2937;">Langkah selanjutnya:</p>
                <ol style="margin: 0; padding-left: 20px;">
                    <li>Masukkan kode OTP di atas pada halaman reset password</li>
                    <li>Buat password baru yang kuat</li>
                    <li>Login dengan password baru Anda</li>
                </ol>
            </div>

            <div class="warning">
                <p><strong>⚠️ Perhatian:</strong> Jangan bagikan kode OTP ini kepada siapapun! Tim ATHLEON tidak akan pernah meminta kode OTP Anda.</p>
            </div>

            <p style="margin-top: 30px;">Jika Anda tidak meminta reset password, abaikan email ini. Akun Anda tetap aman.</p>
        </div>

        <div class="footer">
            <p><strong>ATHLEON</strong></p>
            <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
            <p style="margin-top: 15px;">&copy; 2025 ATHLEON. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
