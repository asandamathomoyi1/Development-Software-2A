import { Nav } from './Nav.js';

export function ResetPasswordPage() {
    return `${Nav('reset')}
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:100px 24px 40px;">
        <div style="width:100%;max-width:420px;" class="anim-scaleIn">
            <div class="glass-2" style="border-radius:24px;padding:36px;">
                <div style="text-align:center;margin-bottom:28px;">
                    <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#0ea5e9,#10b981);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 3c-2.5 0-7 1.25-7 3.75V23h14v.75c0-2.5-4.5-3.75-7-3.75z"/></svg>
                    </div>
                    <h1 style="font-family:'Sora',sans-serif;font-size:24px;font-weight:700;margin-bottom:6px;">Reset your password</h1>
                    <p style="color:var(--text-muted);font-size:14px;">Enter your email and choose a brand new password.</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:16px;">
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Email address</label>
                        <input type="email" id="resetEmail" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="you@example.com" oninput="updateProgressBar('resetEmail')">
                        <div class="progress-container"><div id="resetEmailProgress" class="progress-bar"></div></div>
                    </div>
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">New password <span style="color:var(--text-muted);font-weight:400;">(min. 8 chars, include 1 number & 1 special character)</span></label>
                        <input type="password" id="resetNewPassword" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="New password" onkeydown="if(event.key==='Enter')handleResetPassword()" oninput="updateProgressBar('resetNewPassword')">
                        <div class="progress-container"><div id="resetNewPasswordProgress" class="progress-bar"></div></div>
                    </div>
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Confirm new password</label>
                        <input type="password" id="resetConfirmPassword" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="Confirm new password" onkeydown="if(event.key==='Enter')handleResetPassword()" oninput="updateProgressBar('resetConfirmPassword')">
                        <div class="progress-container"><div id="resetConfirmPasswordProgress" class="progress-bar"></div></div>
                    </div>
                    <div id="resetError" style="color:#f87171;font-size:13px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:8px;" class="hidden"></div>
                    <button onclick="handleResetPassword()" class="btn-primary" style="width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;margin-top:4px;">Reset password</button>
                    <p style="color:var(--text-secondary);font-size:13px;text-align:center;">Please choose a brand new password — not one you forgot.</p>
                </div>
                <div style="margin-top:18px;text-align:center;">
                    <p style="color:var(--text-muted);font-size:13px;">Remembered your password? <button onclick="goto('login')" style="background:none;border:none;cursor:pointer;color:#60a5fa;font-size:13px;" onmouseover="this.style.color='#93c5fd'" onmouseout="this.style.color='#60a5fa'">Sign in</button></p>
                </div>
                <div style="margin-top:10px;text-align:center;">
                    <button onclick="goto('landing')" style="background:none;border:none;color:var(--text-muted);font-size:13px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Back to home</button>
                </div>
            </div>
        </div>
    </div>`;
}
