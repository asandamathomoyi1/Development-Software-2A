document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('loginForm');
    
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            
            const existingErrors = document.querySelectorAll('.error-message');
            existingErrors.forEach(err => err.remove());
            
            
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            
            let isValid = true;
            
            
            if(username === '') {
                showError('username', 'Username is required');
                isValid = false;
            } else if(username.length < 3) {
                showError('username', 'Username must be at least 3 characters');
                isValid = false;
            }
            
            
            if(password === '') {
                showError('password', 'Password is required');
                isValid = false;
            } else if(password.length < 8) {
                showError('password', 'Password must be at least 8 characters long');
                isValid = false;
            }
            
            
            const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
            if(password !== '' && password.length >= 8 && !specialCharRegex.test(password)) {
                showError('password', 'Password must contain at least one special character (!@#$%^&* etc.)');
                isValid = false;
            }
            
            if(isValid) {
                
                localStorage.setItem('loggedInUser', username);
                
                window.location.href = 'HomePage.html';
            }
        });
    }
    
    function showError(inputId, message) {
        const input = document.getElementById(inputId);
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
