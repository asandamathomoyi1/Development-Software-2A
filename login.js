document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const appleBtn = document.getElementById('appleSignInButton');
  const message = document.getElementById('loginMessage');

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      message.textContent = '';
      const email = document.getElementById('emailInput').value.trim();
      const password = document.getElementById('passwordInput').value;
      if (!email || !password) {
        showMessage('Please enter both email and password.', true);
        return;
      }
      try {
        const response = await fetch('/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }
        showMessage(`Welcome back, ${data.user.name}! Redirecting...`);
        window.location.href = '/homepage.html';
      } catch (err) {
        showMessage(err.message, true);
      }
    });
  }

  if (appleBtn) {
    appleBtn.addEventListener('click', handleAppleSignIn);
  }

  // Google sign-in will be initialized when the script loads
});

function initGoogleSignIn() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    const button = document.getElementById('googleSignInButton');
    if (!button) return;
    google.accounts.id.initialize({
      client_id: '55967579577-p1417ojnj57okrjdivfoqcvvc7vct445.apps.googleusercontent.com',
      callback: handleGoogleCredentialResponse
    });
    google.accounts.id.renderButton(button, {
      theme: 'outline',
      size: 'large',
      width: '100%'
    });
    google.accounts.id.prompt();
  }
}

function showMessage(text, isError = false) {
  const message = document.getElementById('loginMessage');
  if (!message) return;
  message.textContent = text;
  message.style.color = isError ? '#dc2626' : '#15803d';
}

async function handleGoogleCredentialResponse(response) {
  if (!response?.credential) {
    showMessage('Google sign-in failed. Please try again.', true);
    return;
  }
  try {
    const res = await fetch('/oauth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google login failed');
    }
    showMessage(`Signed in with Google as ${data.user.name}. Redirecting...`);
    window.location.href = '/homepage.html';
  } catch (err) {
    showMessage(err.message, true);
  }
}

async function handleAppleSignIn() {
  const email = prompt('Enter your iCloud / Apple ID email:');
  if (!email) {
    showMessage('Apple login canceled.', true);
    return;
  }
  const name = prompt('Enter your full name:');
  try {
    const res = await fetch('/oauth/apple', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Apple/iCloud login failed');
    }
    showMessage(`Signed in with Apple as ${data.user.name}. Redirecting...`);
    window.location.href = '/homepage.html';
  } catch (err) {
    showMessage(err.message, true);
  }
}
