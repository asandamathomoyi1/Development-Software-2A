document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form');
    
    if(form && window.location.pathname.includes('register.html')) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            
            const existingErrors = document.querySelectorAll('.error-message');
            existingErrors.forEach(err => err.remove());
            
            
            const username = document.querySelector('#username').value.trim();
            const email = document.querySelector('#email').value.trim();
            const password = document.querySelector('#password').value;
            const confirmPassword = document.querySelector('#confirmPassword');
            
            let isValid = true;
            
            
            if(username === '') {
                showError('username', 'Username is required');
                isValid = false;
            } else if(username.length < 3) {
                showError('username', 'Username must be at least 3 characters');
                isValid = false;
            } else if(username.length > 20) {
                showError('username', 'Username must be less than 20 characters');
                isValid = false;
            }
            
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if(email === '') {
                showError('email', 'Email is required');
                isValid = false;
            } else if(!emailRegex.test(email)) {
                showError('email', 'Please enter a valid email address (e.g., name@example.com)');
                isValid = false;
            }
            
            
            if(password === '') {
                showError('password', 'Password is required');
                isValid = false;
            } else if(password.length < 8) {
                showError('password', 'Password must be at least 8 characters long');
                isValid = false;
            } else if(password.length > 50) {
                showError('password', 'Password must be less than 50 characters');
                isValid = false;
            }
            
            
            const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
            if(password !== '' && password.length >= 8 && !specialCharRegex.test(password)) {
                showError('password', 'Password must contain at least one special character (!@#$%^&* etc.)');
                isValid = false;
            }
            
            
            const uppercaseRegex = /[A-Z]/;
            if(password !== '' && password.length >= 8 && !uppercaseRegex.test(password)) {
                showError('password', 'Password should contain at least one uppercase letter for strength');
                isValid = false;
            }
            
            
            const numberRegex = /[0-9]/;
            if(password !== '' && password.length >= 8 && !numberRegex.test(password)) {
                showError('password', 'Password should contain at least one number for strength');
                isValid = false;
            }
            
            
            if(confirmPassword) {
                if(confirmPassword.value === '') {
                    showError('confirmPassword', 'Please confirm your password');
                    isValid = false;
                } else if(password !== confirmPassword.value) {
                    showError('confirmPassword', 'Passwords do not match');
                    isValid = false;
                }
            }
            
            if(isValid) {
                alert('✓ Registration successful!\n\nUsername: ' + username + '\nEmail: ' + email + '\nPassword meets all requirements!');
                window.location.href = 'index.html';
            }
        });
    }
    
    function showError(inputId, message) {
        const input = document.querySelector(`#${inputId}`);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = '❌ ' + message;
        errorDiv.style.color = '#ff4444';
        errorDiv.style.fontSize = '12px';
        errorDiv.style.marginTop = '5px';
        errorDiv.style.marginBottom = '10px';
        input.parentNode.insertAdjacentElement('afterend', errorDiv);
    }
});
