import { Nav } from './Nav.js';

export function SignupPage() {
    return `${Nav('signup')}
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:100px 24px 40px;">
        <div style="width:100%;max-width:420px;" class="anim-scaleIn">
            <div class="glass-2" style="border-radius:24px;padding:36px;">

                <!-- STEP 1: Signup Form -->
                <div id="signupFormStep">
                    <div style="text-align:center;margin-bottom:32px;">
                        <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                        </div>
                        <h1 style="font-family:'Sora',sans-serif;font-size:24px;font-weight:700;margin-bottom:6px;">Create your account</h1>
                        <p style="color:var(--text-muted);font-size:14px;">Start your wellness journey today</p>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:18px;">
                        <div>
                            <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Full name</label>
                            <input type="text" id="signupName" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="Your full name">
                        </div>
                        <div>
                            <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Email address</label>
                            <input type="email" id="signupEmail" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="you@example.com" oninput="updateProgressBar('signupEmail')">
                            <div class="progress-container"><div id="signupEmailProgress" class="progress-bar"></div></div>
                        </div>
                        <div>
                            <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Password <span style="color:var(--text-muted);font-weight:400;">(min. 8 chars, 1 number & 1 special char)</span></label>
                            <input type="password" id="signupPassword" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="Create a strong password" oninput="updateProgressBar('signupPassword')">
                            <div class="progress-container"><div id="signupPasswordProgress" class="progress-bar"></div></div>
                        </div>
                        <div id="signupError" style="color:#f87171;font-size:13px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:8px;" class="hidden"></div>
                        <button onclick="handleSignupRequestOTP()" id="signupOtpBtn" class="btn-primary" style="width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;margin-top:4px;">
                            Send Verification Code
                        </button>
                        <div id="googleSignupButton" style="margin-top:6px;"></div>
                    </div>

                    <div style="margin-top:22px;text-align:center;">
                        <p style="color:var(--text-muted);font-size:13px;">Already have an account? <button onclick="goto('login')" style="background:none;border:none;cursor:pointer;color:#60a5fa;font-size:13px;" onmouseover="this.style.color='#93c5fd'" onmouseout="this.style.color='#60a5fa'">Sign in</button></p>
                    </div>
                    <div style="margin-top:10px;text-align:center;">
                        <button onclick="goto('landing')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:13px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Back to home</button>
                    </div>
                </div>

                <!-- STEP 2: OTP Verification -->
                <div id="signupOtpStep" style="display:none;">
                    <div style="text-align:center;margin-bottom:28px;">
                        <div style="width:64px;height:64px;border-radius:20px;background:linear-gradient(135deg,#3b82f6,#2563eb);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </div>
                        <h2 style="font-family:'Sora',sans-serif;font-size:22px;font-weight:700;margin-bottom:8px;">Check your email</h2>
                        <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;">We sent a 6-digit verification code to</p>
                        <p id="signupOtpEmailDisplay" style="color:#60a5fa;font-size:14px;font-weight:600;margin-top:4px;"></p>
                    </div>

                    <!-- OTP Input Boxes -->
                    <div style="display:flex;gap:10px;justify-content:center;margin-bottom:24px;">
                        ${[0,1,2,3,4,5].map(i => `
                        <input
                            type="text"
                            maxlength="1"
                            id="signupOtp${i}"
                            class="input-glass"
                            style="width:48px;height:56px;text-align:center;font-size:22px;font-weight:700;border-radius:12px;padding:0;font-family:'Sora',sans-serif;"
                            oninput="otpInputMove(this, ${i}, 'signupOtp')"
                            onkeydown="otpInputBack(event, ${i}, 'signupOtp')"
                            onpaste="otpPaste(event, 'signupOtp')"
                        >`).join('')}
                    </div>

                    <!-- Timer -->
                    <div style="text-align:center;margin-bottom:20px;">
                        <p style="color:var(--text-muted);font-size:13px;">
                            Code expires in <span id="signupOtpTimer" style="color:#60a5fa;font-weight:600;">5:00</span>
                        </p>
                    </div>

                    <div id="signupOtpError" style="color:#f87171;font-size:13px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:8px;margin-bottom:16px;" class="hidden"></div>

                    <button onclick="handleSignupVerifyOTP()" class="btn-primary" style="width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;">
                        Verify &amp; Create Account
                    </button>

                    <div style="margin-top:18px;display:flex;justify-content:space-between;align-items:center;">
                        <button onclick="backToSignupForm()" style="background:none;border:none;color:var(--text-muted);font-size:13px;cursor:pointer;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Change email</button>
                        <button onclick="handleSignupResendOTP()" id="signupResendBtn" style="background:none;border:none;color:#60a5fa;font-size:13px;cursor:pointer;" onmouseover="this.style.color='#93c5fd'" onmouseout="this.style.color='#60a5fa'">Resend code</button>
                    </div>
                </div>

            </div>
        </div>
    </div>`;
}
