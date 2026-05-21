import { Nav } from './Nav.js';

export function TermsPage() {
    return `${Nav('terms')}
    <div style="padding-top:110px;padding-bottom:80px;padding-left:24px;padding-right:24px;min-height:100vh;">
        <div style="max-width:720px;margin:0 auto;" class="anim-fadeUp">
            <button onclick="goto('landing')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:14px;margin-bottom:36px;display:flex;align-items:center;gap:6px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)';">← Back to home</button>
            <div class="badge" style="display:inline-block;margin-bottom:20px;">Terms of Service</div>
            <h1 style="font-family:'Sora',sans-serif;font-size:clamp(32px,5vw,54px);font-weight:700;line-height:1.1;margin-bottom:20px;">Terms and <span class="text-aurora">conditions</span></h1>
            <p style="color:var(--text-secondary);font-size:17px;line-height:1.8;margin-bottom:36px;">Please read these terms carefully before using Digital Mental Health Platform.</p>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">Acceptance of terms</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">By using our platform, you agree to these terms. If you do not agree, please do not use the service.</p>
            </div>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">User responsibilities</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">You are responsible for maintaining the confidentiality of your account and for all activities under your account.</p>
            </div>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">Service availability</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">We strive for 99.9% uptime but cannot guarantee uninterrupted service. We reserve the right to modify or discontinue the service.</p>
            </div>
        </div>
    </div>`;
}
