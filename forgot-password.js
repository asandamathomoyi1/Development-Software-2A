document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('forgotForm');
    
    if(form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const existingErrors = document.querySelectorAll('.error-message');
            existingErrors.forEach(err => err.remove());
            
            const email = document.getElementById('email').value.trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if(email === '') {
                showError('email', 'Email is required');
                return;
            } else if(!emailRegex.test(email)) {
                showError('email', 'Please enter a valid email address');
                return;
            }
            
            alert('Password reset link sent to: ' + email + '\n\nPlease check your email inbox.');
            window.location.href = 'index.html';
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
        input.parentNode.insertAdjacentElement('afterend', errorDiv);
    }
});