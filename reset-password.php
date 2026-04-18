<?php
session_start();

// Load users from JSON file
$usersFile = 'users.json';
$users = [];

if (file_exists($usersFile)) {
    $users = json_decode(file_get_contents($usersFile), true);
}

$token = $_GET['token'] ?? '';
$validToken = false;
$userEmail = '';
$username = '';
$errorMessage = '';
$successMessage = '';

// VALIDATION 1: Check if token exists
if (empty($token)) {
    $errorMessage = 'Invalid reset link. Please request a new password reset.';
} 
// VALIDATION 2: Check token format (should be 64 characters hex)
elseif (!preg_match('/^[a-f0-9]{64}$/', $token)) {
    $errorMessage = 'Invalid reset link format. Please request a new password reset.';
}
else {
    // Verify token
    foreach ($users as &$user) {
        if (isset($user['reset_token']) && $user['reset_token'] === $token) {
            // VALIDATION 3: Check if token is expired
            if ($user['reset_expiry'] > date('Y-m-d H:i:s')) {
                $validToken = true;
                $userEmail = $user['email'];
                $username = $user['username'];
            } else {
                $errorMessage = 'Reset link has expired. Please request a new one.';
            }
            break;
        }
    }
    
    if (!$validToken && empty($errorMessage)) {
        $errorMessage = 'Invalid reset link. Please request a new password reset.';
    }
}

// Handle password update with validations
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $validToken) {
    $newPassword = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    $errors = [];
    
    // VALIDATION 1: Password is required
    if (empty($newPassword)) {
        $errors[] = 'Password is required';
    }
    
    // VALIDATION 2: Password minimum length (8 characters)
    if (strlen($newPassword) < 8) {
        $errors[] = 'Password must be at least 8 characters long';
    }
    
    // VALIDATION 3: Password maximum length
    if (strlen($newPassword) > 50) {
        $errors[] = 'Password must be less than 50 characters';
    }
    
    // VALIDATION 4: Password must contain at least one special character
    if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $newPassword)) {
        $errors[] = 'Password must contain at least one special character (!@#$%^&* etc.)';
    }
    
    // VALIDATION 5: Password must contain at least one uppercase letter
    if (!preg_match('/[A-Z]/', $newPassword)) {
        $errors[] = 'Password must contain at least one uppercase letter';
    }
    
    // VALIDATION 6: Password must contain at least one lowercase letter
    if (!preg_match('/[a-z]/', $newPassword)) {
        $errors[] = 'Password must contain at least one lowercase letter';
    }
    
    // VALIDATION 7: Password must contain at least one number
    if (!preg_match('/[0-9]/', $newPassword)) {
        $errors[] = 'Password must contain at least one number';
    }
    
    // VALIDATION 8: Check for common weak passwords
    $weakPasswords = ['password123!', 'Password123!', 'Admin123!', 'Welcome123!'];
    if (in_array(strtolower($newPassword), $weakPasswords)) {
        $errors[] = 'Password is too common. Please choose a stronger password.';
    }
    
    // VALIDATION 9: Check if passwords match
    if ($newPassword !== $confirmPassword) {
        $errors[] = 'Passwords do not match';
    }
    
    // VALIDATION 10: Check if confirm password is empty
    if (empty($confirmPassword)) {
        $errors[] = 'Please confirm your password';
    }
    
    // If no errors, update password
    if (empty($errors)) {
        foreach ($users as &$user) {
            if ($user['email'] === $userEmail) {
                // Hash the password before storing
                $user['password'] = password_hash($newPassword, PASSWORD_DEFAULT);
                // Clear reset token
                unset($user['reset_token']);
                unset($user['reset_expiry']);
                break;
            }
        }
        
        // Save updated users
        if (file_put_contents($usersFile, json_encode($users))) {
            $successMessage = 'Password reset successful! Redirecting to login...';
            // Redirect after 2 seconds
            header("refresh:2;url=index.html");
        } else {
            $errorMessage = 'Unable to save new password. Please try again.';
        }
    } else {
        $errorMessage = implode('<br>', $errors);
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Digital Mental Health Platform</title>
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
        .password-requirements {
            background: rgba(255,255,255,0.1);
            padding: 10px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 12px;
            text-align: left;
        }
        .password-requirements ul {
            margin: 5px 0;
            padding-left: 20px;
        }
        .password-requirements li {
            margin: 3px 0;
        }
        .requirement-met {
            color: #4CAF50;
        }
        .requirement-unmet {
            color: #ff8888;
        }
    </style>
</head>
<body>
    <h1 class="main-title">Digital Mental Health Support Platform</h1>
    <div class="login-card">
        <h2 class="welcome">Create New Password</h2>
        <p class="login-text">Enter your new password below</p>
        
        <?php if ($errorMessage): ?>
            <div class="error-message">❌ <?php echo $errorMessage; ?></div>
        <?php endif; ?>
        
        <?php if ($successMessage): ?>
            <div class="success-message">✓ <?php echo $successMessage; ?></div>
        <?php endif; ?>
        
        <?php if (!$errorMessage && !$successMessage && $validToken): ?>
            <div class="password-requirements">
                <strong>Password Requirements:</strong>
                <ul>
                    <li id="req-length">✓ At least 8 characters long</li>
                    <li id="req-special">✓ At least 1 special character (!@#$%^&*)</li>
                    <li id="req-upper">✓ At least 1 uppercase letter (A-Z)</li>
                    <li id="req-lower">✓ At least 1 lowercase letter (a-z)</li>
                    <li id="req-number">✓ At least 1 number (0-9)</li>
                </ul>
            </div>
            
            <form method="POST" action="" id="resetForm">
                <label for="password">New Password</label>
                <div class="input-group">
                    <span class="icon">🔑</span>
                    <input type="password" id="password" name="password" placeholder="Enter new password" required>
                </div>
                
                <label for="confirm_password">Confirm Password</label>
                <div class="input-group">
                    <span class="icon">✓</span>
                    <input type="password" id="confirm_password" name="confirm_password" placeholder="Confirm your password" required>
                </div>
                
                <button type="submit">Reset Password</button>
            </form>
            
            <script>
                // Real-time password validation
                const passwordInput = document.getElementById('password');
                const confirmInput = document.getElementById('confirm_password');
                
                function validatePassword() {
                    const password = passwordInput.value;
                    
                    // Check each requirement
                    document.getElementById('req-length').style.color = password.length >= 8 ? '#4CAF50' : '#ff8888';
                    document.getElementById('req-special').style.color = /[!@#$%^&*(),.?":{}|<>]/.test(password) ? '#4CAF50' : '#ff8888';
                    document.getElementById('req-upper').style.color = /[A-Z]/.test(password) ? '#4CAF50' : '#ff8888';
                    document.getElementById('req-lower').style.color = /[a-z]/.test(password) ? '#4CAF50' : '#ff8888';
                    document.getElementById('req-number').style.color = /[0-9]/.test(password) ? '#4CAF50' : '#ff8888';
                }
                
                passwordInput.addEventListener('keyup', validatePassword);
                passwordInput.addEventListener('change', validatePassword);
            </script>
        <?php endif; ?>
        
        <?php if (!$validToken && !$successMessage): ?>
            <p style="text-align:center;"><a href="forgot-password.php">Request New Reset Link</a></p>
        <?php endif; ?>
        
        <p><a href="index.html">Back to Login</a></p>
    </div>
</body>
</html>