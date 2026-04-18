<?php
// Load PHPMailer files
require __DIR__ . '/PHPMailer/Exception.php';
require __DIR__ . '/PHPMailer/PHPMailer.php';
require __DIR__ . '/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

function sendPasswordResetEmail($toEmail, $toName, $resetLink) {
    // VALIDATION: Check if email is valid
    if (empty($toEmail) || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return ['success' => false, 'message' => 'Invalid recipient email address'];
    }
    
    // ⚠️ REPLACE WITH YOUR ACTUAL CREDENTIALS ⚠️
    $yourEmail = 'YOUR_EMAIL@gmail.com';        // YOUR GMAIL
    $yourAppPassword = 'YOUR_16_CHAR_APP_PASSWORD'; // APP PASSWORD
    
    // Check if credentials are set
    if ($yourEmail === 'YOUR_EMAIL@gmail.com') {
        return ['success' => false, 'message' => 'Email not configured. Please contact administrator.'];
    }
    
    $mail = new PHPMailer(true);
    
    try {
        // Enable verbose debug output (remove after testing)
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER;
        
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = $yourEmail;
        $mail->Password = $yourAppPassword;
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;
        $mail->Timeout = 30;
        
        // Recipients
        $mail->setFrom($yourEmail, 'Digital Mental Health Platform');
        $mail->addAddress($toEmail, $toName);
        
        // Email content
        $mail->isHTML(true);
        $mail->Subject = 'Reset Your Password - Digital Mental Health Platform';
        $mail->Body = "
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Hello {$toName},</h2>
                <p>We received a request to reset your password.</p>
                <p>Click the link below to reset your password:</p>
                <p><a href='{$resetLink}'>Reset Password</a></p>
                <p>This link expires in 1 hour.</p>
                <p>If you did not request this, please ignore this email.</p>
                <hr>
                <p>Digital Mental Health Platform - Your wellbeing matters</p>
            </body>
            </html>
        ";
        
        $mail->AltBody = "Hello {$toName},\n\nReset your password: {$resetLink}\n\nThis link expires in 1 hour.";
        
        $mail->send();
        return ['success' => true, 'message' => 'Email sent successfully'];
        
    } catch (Exception $e) {
        // Log error for debugging
        error_log("PHPMailer Error: " . $mail->ErrorInfo);
        return ['success' => false, 'message' => $mail->ErrorInfo];
    }
}
?>