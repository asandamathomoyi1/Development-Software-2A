import { Nav } from './Nav.js';

export function SupportPage() {
    return `${Nav('support')}
    <div style="padding-top:110px;padding-bottom:80px;padding-left:24px;padding-right:24px;min-height:100vh;">
        <div style="max-width:720px;margin:0 auto;" class="anim-fadeUp">
            <button onclick="goto('landing')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:14px;margin-bottom:36px;display:flex;align-items:center;gap:6px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)';">← Back to home</button>
            <div class="badge" style="display:inline-block;margin-bottom:20px;">Support</div>
            <h1 style="font-family:'Sora',sans-serif;font-size:clamp(32px,5vw,54px);font-weight:700;line-height:1.1;margin-bottom:20px;">We're here to <span class="text-aurora">help</span></h1>
            <p style="color:var(--text-secondary);font-size:17px;line-height:1.8;margin-bottom:36px;">Get support for using Digital Mental Health Platform or managing your mental health.</p>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">Contact us</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">Email: support@digitalmentalhealth.com<br>Response time: Within 24 hours</p>
            </div>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">Crisis support</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">If you're in crisis, please contact emergency services or a crisis hotline immediately. This platform is not a substitute for professional help.</p>
            </div>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">FAQs</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">Check our FAQ section on the landing page for common questions and answers.</p>
            </div>
        </div>
    </div>`;
}
