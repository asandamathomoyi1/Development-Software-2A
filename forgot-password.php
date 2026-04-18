<?php
// Start session for error/success messages
session_start();

// Load users from JSON file
$usersFile = 'users.json';
$users = [];

if (file_exists($usersFile)) {
    $users = json_decode(file_get_contents($usersFile), true);
}

$error = '';
$success = '';

// PHP Validation - Server Side
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // VALIDATION 1: Check if email is provided
    if (empty($_POST['email'])) {
        $error = 'Email address is required';
    } 
    // VALIDATION 2: Validate email format
    elseif (!filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address (e.g., name@example.com)';
    }
    // VALIDATION 3: Check email length
    elseif (strlen($_POST['email']) > 100) {
        $error = 'Email address is too long';
    }
    // VALIDATION 4: Check for invalid characters
    elseif (preg_match('/[<>\"\'();&]/', $_POST['email'])) {
        $error = 'Email contains invalid characters';
    }
    else {
        $email = trim($_POST['email']);
        
        // Find user by email
        $userFound = false;
        $username = '';
        
        foreach ($users as &$user) {
            if ($user['email'] === $email) {
                $userFound = true;
                $username = $user['username'];
                
                // Generate secure reset token
                $resetToken = bin2hex(random_bytes(32));
                $resetExpiry = date('Y-m-d H:i:s', strtotime('+1 hour'));
                
                $user['reset_token'] = $resetToken;
                $user['reset_expiry'] = $resetExpiry;
                break;
            }
        }
        
        if ($userFound) {
            // Save updated users
            file_put_contents($usersFile, json_encode($users));
            
            // Create reset link
            $resetLink = "http://localhost/DSW_Project/reset-password.php?token=" . $resetToken;
            
            // Load email function
            require_once 'send_email.php';
            $emailResult = sendPasswordResetEmail($email, $username, $resetLink);
            
            if ($emailResult['success']) {
                $success = 'Password reset link has been sent to your email address. Please check your inbox.';
            } else {
                $error = 'Unable to send email. Error: ' . $emailResult['message'];
            }
        } else {
            // For security, don't reveal if email exists
            $success = 'If an account exists with this email address, you will receive a password reset link.';
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password - Digital Mental Health Platform</title>
    <link rel="stylesheet" href="style.css">
    <style>
        .error-message {
            background: #ff4444;
            color: white;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            text-align: center;
        }
        .success-message {
            background: #4CAF50;
            color: white;
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            text-align: center;
        }
    </style>
</head>
<body>
    <h1 class="main-title">Digital Mental Health Support Platform</h1>
    <div class="login-card">
        <h2 class="welcome">Reset Password</h2>
        <p class="login-text">Enter your email to receive reset link</p>
        
        <?php if ($error): ?>
            <div class="error-message">❌ <?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success-message">✓ <?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <form method="POST" action="">
            <label for="email">Email Address</label>
            <div class="input-group">
                <span class="icon">📧</span>
                <input type="email" id="email" name="email" placeholder="Enter your registered email" value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>" required>
            </div>
            <button type="submit">Send Reset Link</button>
        </form>
        
        <p><a href="index.html">Back to Login</a></p>
    </div>
</body>
</html>