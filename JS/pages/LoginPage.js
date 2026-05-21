import { Nav } from './Nav.js';

export function LoginPage() {
    return `${Nav('login')}
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:100px 24px 40px;">
        <div style="width:100%;max-width:420px;" class="anim-scaleIn">
            <div class="glass-2" style="border-radius:24px;padding:36px;">
                <div style="text-align:center;margin-bottom:32px;">
                    <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#0ea5e9,#10b981);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <h1 style="font-family:'Sora',sans-serif;font-size:24px;font-weight:700;margin-bottom:6px;">Welcome back</h1>
                    <p style="color:var(--text-muted);font-size:14px;">Continue your wellness journey</p>
                </div>

                <div style="display:flex;flex-direction:column;gap:18px;">
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Email address</label>
                        <input type="email" id="loginEmail" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="you@example.com" oninput="updateProgressBar('loginEmail')">
                        <div class="progress-container"><div id="loginEmailProgress" class="progress-bar"></div></div>
                    </div>
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Password</label>
                        <input type="password" id="loginPassword" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="Your password" onkeydown="if(event.key==='Enter')handleLogin()" oninput="updateProgressBar('loginPassword')">
                        <div class="progress-container"><div id="loginPasswordProgress" class="progress-bar"></div></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:-4px;">
                        <button onclick="goto('reset')" style="background:none;border:none;color:#60a5fa;font-size:13px;cursor:pointer;" onmouseover="this.style.color='#93c5fd'" onmouseout="this.style.color='#60a5fa'">Forgot password?</button>
                        <span style="color:var(--text-muted);font-size:12px;">Must be new and strong</span>
                    </div>
                    <div id="loginError" style="color:#f87171;font-size:13px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:8px;" class="hidden"></div>
                    <button onclick="handleLogin()" class="btn-primary" style="width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;margin-top:4px;">Sign in</button>
                    <div id="googleLoginButton" style="margin-top:14px;"></div>
                </div>

                <div style="margin-top:22px;text-align:center;">
                    <p style="color:var(--text-muted);font-size:13px;">Don't have an account? <button onclick="goto('signup')" style="background:none;border:none;cursor:pointer;color:#60a5fa;font-size:13px;" onmouseover="this.style.color='#93c5fd'" onmouseout="this.style.color='#60a5fa'">Sign up free</button></p>
                </div>
                <div style="margin-top:10px;text-align:center;">
                    <button onclick="goto('landing')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:13px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Back to home</button>
                </div>
            </div>
        </div>
    </div>`;
}
