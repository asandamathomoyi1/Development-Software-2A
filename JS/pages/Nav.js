export function Nav(page, currentUser) {
    const auth = !!currentUser;
    return `
    <nav class="nav-glass fixed top-0 left-0 right-0 z-50">
        <div style="max-width:1200px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;">
            <button onclick="goto('${auth ? 'dashboard' : 'landing'}')" style="display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;">
                <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <span style="font-family:'Sora',sans-serif;font-weight:600;font-size:16px;color:var(--text-primary);">Digital Mental Health Platform</span>
            </button>

            <div style="display:flex;align-items:center;gap:6px;">
                ${
                  auth
                    ? `
                    ${page !== 'dashboard' ? `<button onclick="backToDashboard()" class="btn-glass" style="padding:7px 16px;border-radius:8px;font-size:14px;cursor:pointer;margin-right:6px;">Back</button>` : ''}
                    <button onclick="goto('dashboard')" class="nav-link ${page === 'dashboard' || page === 'games' ? 'active' : ''}">Dashboard</button>
                    <button onclick="goto('chatbot')" class="nav-link ${page === 'chatbot' ? 'active' : ''}">AI Companion</button>
                    <button onclick="goto('resources')" class="nav-link ${page === 'resources' ? 'active' : ''}">Resources</button>
                    <button onclick="goto('profile')" class="nav-link ${page === 'profile' ? 'active' : ''}">Profile</button>
                    <button onclick="logout()" class="btn-ghost" style="padding:7px 16px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:6px;">Sign out</button>
                `
                    : `
                    <button onclick="scrollToSection('features')" class="nav-link">Features</button>
                    <button onclick="scrollToSection('howItWorks')" class="nav-link">How it works</button>
                    <button onclick="scrollToSection('resources')" class="nav-link">Resources</button>
                    <button onclick="scrollToSection('faq')" class="nav-link">FAQ</button>
                    <button onclick="goto('about')" class="nav-link">About</button>
                    <button onclick="goto('login')" class="btn-ghost" style="padding:7px 16px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:4px;">Log in</button>
                    <button onclick="goto('signup')" class="btn-primary" style="padding:8px 18px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:2px;">Sign up free</button>
                `
                }
            </div>
        </div>
    </nav>`;
}
