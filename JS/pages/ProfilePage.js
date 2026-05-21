import { Nav } from './Nav.js';

export function ProfilePage({ currentUser, moodHistory, moodOptions, chatMessages }) {
    const total = moodHistory.length;
    const avg = total ? (moodHistory.reduce((s, e) => s + e.mood, 0) / total).toFixed(1) : '—';
    const best = total ? moodOptions.find(o => o.value === Math.max(...moodHistory.map(e => e.mood)))?.label : '—';
    const userChats = chatMessages.filter(m => m.sender === 'user').length;

    return `${Nav('profile', currentUser)}
    <div style="padding-top:100px;padding-bottom:60px;padding-left:24px;padding-right:24px;min-height:100vh;">
        <div style="max-width:620px;margin:0 auto;" class="anim-fadeUp">
            <h1 style="font-family:'Sora',sans-serif;font-size:28px;font-weight:700;margin-bottom:28px;">My profile</h1>

            <!-- Profile card -->
            <div class="glass" style="border-radius:22px;padding:28px;margin-bottom:18px;">
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;">
                    <div class="profile-avatar" style="width:60px;height:60px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-family:'Sora',sans-serif;font-size:24px;font-weight:700;color:white;flex-shrink:0;">
                        ${currentUser?.name[0].toUpperCase()}
                    </div>
                    <div>
                        <div style="font-family:'Sora',sans-serif;font-size:20px;font-weight:600;margin-bottom:3px;">${currentUser?.name}</div>
                        <div style="color:var(--text-muted);font-size:13px;">${currentUser?.email}</div>
                        <div class="badge" style="display:inline-block;margin-top:6px;font-size:11px;">Member</div>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;border-top:1px solid rgba(56,189,248,0.1);padding-top:20px;">
                    ${[
                        [total.toString(),'Mood entries','#60a5fa'],
                        [avg,'Average mood','#34d399'],
                        [userChats.toString(),'Chat messages','#a78bfa'],
                    ].map(([v,l,c]) => `
                        <div style="text-align:center;">
                            <div style="font-family:'Sora',sans-serif;font-size:22px;font-weight:700;color:${c};">${v}</div>
                            <div style="color:var(--text-muted);font-size:12px;margin-top:2px;">${l}</div>
                        </div>`
                    ).join('')}
                </div>
            </div>

            <!-- Stats detail -->
            <div class="glass" style="border-radius:22px;padding:24px;margin-bottom:18px;">
                <h3 style="font-family:'Sora',sans-serif;font-size:16px;font-weight:600;margin-bottom:16px;">Wellness stats</h3>
                <div style="display:flex;flex-direction:column;gap:0;">
                    ${[
                        ['Best recorded mood', best],
                        ['Total mood entries', total.toString()],
                        ['Chat conversations', userChats.toString()],
                        ['Member since', new Date().toLocaleDateString('en-ZA',{year:'numeric',month:'long'})],
                    ].map(([l,v]) => `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid rgba(56,189,248,0.06);">
                            <span style="color:var(--text-secondary);font-size:14px;">${l}</span>
                            <span style="color:var(--text-primary);font-size:14px;font-weight:500;font-family:'Sora',sans-serif;">${v}</span>
                        </div>`
                    ).join('')}
                </div>
            </div>

            <!-- Account actions -->
            <div class="glass" style="border-radius:22px;padding:24px;">
                <h3 style="font-family:'Sora',sans-serif;font-size:16px;font-weight:600;margin-bottom:16px;">Account</h3>
                <div style="display:flex;flex-wrap:wrap;gap:10px;">
                    <button onclick="if(confirm('Clear all mood data?')){moodHistory=[];save();goto('profile');}" class="btn-ghost" style="padding:9px 18px;border-radius:9px;font-size:14px;cursor:pointer;color:#f87171;border-color:rgba(239,68,68,0.25);">
                        Clear mood history
                    </button>
                    <button onclick="logout()" class="btn-ghost" style="padding:9px 18px;border-radius:9px;font-size:14px;cursor:pointer;">
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    </div>`;
}
