import { Nav } from './Nav.js';

export function PrivacyPage() {
    return `${Nav('privacy')}
    <div style="padding-top:110px;padding-bottom:80px;padding-left:24px;padding-right:24px;min-height:100vh;">
        <div style="max-width:720px;margin:0 auto;" class="anim-fadeUp">
            <button onclick="goto('landing')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:14px;margin-bottom:36px;display:flex;align-items:center;gap:6px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)';">← Back to home</button>
            <div class="badge" style="display:inline-block;margin-bottom:20px;">Privacy Policy</div>
            <h1 style="font-family:'Sora',sans-serif;font-size:clamp(32px,5vw,54px);font-weight:700;line-height:1.1;margin-bottom:20px;">Your privacy is our <span class="text-aurora">priority</span></h1>
            <p style="color:var(--text-secondary);font-size:17px;line-height:1.8;margin-bottom:36px;">We are committed to protecting your personal information and being transparent about how we use it.</p>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">Data collection</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">We collect only the information necessary to provide our services: your email, name, mood entries, and chat messages. All data is encrypted and stored securely.</p>
            </div>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">Data usage</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">Your data is used solely to provide personalized mental health support, improve our AI companion, and ensure platform security. We never sell or share your data with third parties.</p>
            </div>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">Your rights</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">You have the right to access, update, or delete your data at any time. Contact us for data export or account deletion requests.</p>
            </div>
        </div>
    </div>`;
}
