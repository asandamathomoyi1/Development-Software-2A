import { Nav } from './Nav.js';

export function ResetPasswordPage() {
    return `${Nav('reset')}
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:100px 24px 40px;">
        <div style="width:100%;max-width:420px;" class="anim-scaleIn">
            <div class="glass-2" style="border-radius:24px;padding:36px;">

                <!-- STEP 1: Enter Email -->
                <div id="resetEmailStep">
                    <div style="text-align:center;margin-bottom:28px;">
                        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </div>
                        <h1 style="font-family:'Sora',sans-serif;font-size:24px;font-weight:700;margin-bottom:6px;">Reset your password</h1>
                        <p style="color:var(--text-muted);font-size:14px;">Enter your email to receive a verification code.</p>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div>
                            <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Email address</label>
                            <input type="email" id="resetEmail" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="you@example.com" oninput="updateProgressBar('resetEmail')" onkeydown="if(event.key==='Enter')handleResetRequestOTP()">
                            <div class="progress-container"><div id="resetEmailProgress" class="progress-bar"></div></div>
                        </div>
                        <div id="resetEmailError" style="color:#f87171;font-size:13px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:8px;" class="hidden"></div>
                        <button onclick="handleResetRequestOTP()" class="btn-primary" style="width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;margin-top:4px;">
                            Send Verification Code
                        </button>
                    </div>
                    <div style="margin-top:18px;text-align:center;">
                        <p style="color:var(--text-muted);font-size:13px;">Remembered your password? <button onclick="goto('login')" style="background:none;border:none;cursor:pointer;color:#60a5fa;font-size:13px;" onmouseover="this.style.color='#93c5fd'" onmouseout="this.style.color='#60a5fa'">Sign in</button></p>
                    </div>
                    <div style="margin-top:10px;text-align:center;">
                        <button onclick="goto('landing')" style="background:none;border:none;color:var(--text-muted);font-size:13px;cursor:pointer;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Back to home</button>
                    </div>
                </div>

                <!-- STEP 2: Enter OTP -->
                <div id="resetOtpStep" style="display:none;">
                    <div style="text-align:center;margin-bottom:28px;">
                        <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </div>
                        <h2 style="font-family:'Sora',sans-serif;font-size:22px;font-weight:700;margin-bottom:8px;">Check your email</h2>
                        <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;">We sent a 6-digit code to</p>
                        <p id="resetOtpEmailDisplay" style="color:#60a5fa;font-size:14px;font-weight:600;margin-top:4px;"></p>
                    </div>

                    <!-- OTP Input Boxes -->
                    <div style="display:flex;gap:10px;justify-content:center;margin-bottom:24px;">
                        ${[0,1,2,3,4,5].map(i => `
                        <input
                            type="text"
                            maxlength="1"
                            id="resetOtp${i}"
                            class="input-glass"
                            style="width:48px;height:56px;text-align:center;font-size:22px;font-weight:700;border-radius:12px;padding:0;font-family:'Sora',sans-serif;"
                            oninput="otpInputMove(this, ${i}, 'resetOtp')"
                            onkeydown="otpInputBack(event, ${i}, 'resetOtp')"
                            onpaste="otpPaste(event, 'resetOtp')"
                        >`).join('')}
                    </div>

                    <!-- Timer -->
                    <div style="text-align:center;margin-bottom:20px;">
                        <p style="color:var(--text-muted);font-size:13px;">
                            Code expires in <span id="resetOtpTimer" style="color:#60a5fa;font-weight:600;">5:00</span>
                        </p>
                    </div>

                    <div id="resetOtpError" style="color:#f87171;font-size:13px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:8px;margin-bottom:16px;" class="hidden"></div>

                    <button onclick="handleResetVerifyOTP()" class="btn-primary" style="width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;">
                        Verify Code
                    </button>

                    <div style="margin-top:18px;display:flex;justify-content:space-between;align-items:center;">
                        <button onclick="backToResetEmail()" style="background:none;border:none;color:var(--text-muted);font-size:13px;cursor:pointer;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Change email</button>
                        <button onclick="handleResetResendOTP()" id="resetResendBtn" style="background:none;border:none;color:#60a5fa;font-size:13px;cursor:pointer;" onmouseover="this.style.color='#93c5fd'" onmouseout="this.style.color='#60a5fa'">Resend code</button>
                    </div>
                </div>

                <!-- STEP 3: New Password Form -->
                <div id="resetPasswordStep" style="display:none;">
                    <div style="text-align:center;margin-bottom:28px;">
                        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#22c55e,#16a34a);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                        <h2 style="font-family:'Sora',sans-serif;font-size:22px;font-weight:700;margin-bottom:6px;">Set new password</h2>
                        <p style="color:var(--text-muted);font-size:14px;">Choose a strong new password.</p>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div>
                            <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">New password <span style="color:var(--text-muted);font-weight:400;">(min. 8 chars, 1 number &amp; 1 special char)</span></label>
                            <input type="password" id="resetNewPassword" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="New password" oninput="updateProgressBar('resetNewPassword')">
                            <div class="progress-container"><div id="resetNewPasswordProgress" class="progress-bar"></div></div>
                        </div>
                        <div>
                            <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Confirm new password</label>
                            <input type="password" id="resetConfirmPassword" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="Confirm new password" onkeydown="if(event.key==='Enter')handleResetPassword()" oninput="updateProgressBar('resetConfirmPassword')">
                            <div class="progress-container"><div id="resetConfirmPasswordProgress" class="progress-bar"></div></div>
                        </div>
                        <div id="resetError" style="color:#f87171;font-size:13px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:8px;" class="hidden"></div>
                        <button onclick="handleResetPassword()" class="btn-primary" style="width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;margin-top:4px;">
                            Reset Password
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>`;
}
