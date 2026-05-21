import { Nav } from './Nav.js';

export function AboutPage() {
    return `${Nav('about')}
    <div style="padding-top:110px;padding-bottom:80px;padding-left:24px;padding-right:24px;min-height:100vh;">
        <div style="max-width:720px;margin:0 auto;" class="anim-fadeUp">
            <button onclick="goto('landing')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:14px;margin-bottom:36px;display:flex;align-items:center;gap:6px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)';">← Back to home</button>
            <div class="badge" style="display:inline-block;margin-bottom:20px;">About Digital Mental Health Platform</div>
            <h1 style="font-family:'Sora',sans-serif;font-size:clamp(32px,5vw,54px);font-weight:700;line-height:1.1;margin-bottom:20px;">We believe mental health <span class="text-aurora">matters</span></h1>
            <p style="color:var(--text-secondary);font-size:17px;line-height:1.8;margin-bottom:36px;">Digital Mental Health Platform was built by a team that deeply understands emotional struggle. We know that asking for help can feel impossible — so we created a platform that meets you exactly where you are.</p>

            <div class="glass" style="border-radius:20px;padding:32px;margin-bottom:28px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:14px;">Our mission</h2>
                <p style="color:var(--text-secondary);line-height:1.8;">To make mental health support accessible, private, and stigma-free for everyone. Whether you're managing anxiety, low mood, burnout, or simply want to build stronger emotional habits — Digital Mental Health Platform is here for you, every day.</p>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:40px;">
                ${[{e:'🌍',t:'Accessible',d:'Available 24/7, anywhere, at no cost to begin.'},{e:'🔒',t:'Private',d:"Your data is yours. We never sell or share it."},{e:'💙',t:'Compassionate',d:'Built with empathy at every level, by people who understand.'}].map(v => `
                    <div class="feature-card" style="border-radius:16px;padding:20px;text-align:center;">
                        <div style="font-size:28px;margin-bottom:10px;">${v.e}</div>
                        <h3 style="font-family:'Sora',sans-serif;font-size:14px;font-weight:600;margin-bottom:6px;">${v.t}</h3>
                        <p style="color:var(--text-secondary);font-size:13px;line-height:1.5;">${v.d}</p>
                    </div>`
                ).join('')}
            </div>

            <div style="text-align:center;">
                <button onclick="goto('signup')" class="btn-primary" style="padding:14px 36px;border-radius:12px;font-size:16px;cursor:pointer;">Join Digital Mental Health Platform free</button>
            </div>
        </div>
    </div>`;
}
