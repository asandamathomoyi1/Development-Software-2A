import { Nav } from './Nav.js';

export function DashboardPage({ currentUser, moodHistory, moodOptions }) {
    const total = moodHistory.length;
    const avg = total ? (moodHistory.reduce((s, e) => s + e.mood, 0) / total).toFixed(1) : '—';
    const latest = total ? moodOptions.find(o => o.value === moodHistory[moodHistory.length - 1].mood) : null;

    return `${Nav('dashboard', currentUser)}
    <div style="padding-top:90px;padding-bottom:60px;padding-left:24px;padding-right:24px;min-height:100vh;">
        <div style="max-width:1100px;margin:0 auto;">

            <!-- Header -->
            <div style="display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:28px;" class="anim-fadeUp">
                <div>
                    <h1 style="font-family:'Sora',sans-serif;font-size:28px;font-weight:700;margin-bottom:4px;">Good day, ${currentUser?.name} 🌊</h1>
                    <p style="color:var(--text-secondary);font-size:15px;">How's the water today?</p>
                </div>
                <button onclick="goto('chatbot')" class="btn-primary" style="padding:11px 20px;border-radius:10px;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    AI Companion
                </button>
            </div>

            <!-- Stats -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:22px;" class="anim-fadeUp">
                ${[
                    ['Total entries', total.toString(), '#60a5fa'],
                    ['Avg mood', avg, '#34d399'],
                    ['Latest', latest?.emoji || '—', '#a78bfa'],
                ].map(([label, val, color]) => `
                    <div class="stat-card" style="padding:16px;border-radius:14px;text-align:center;">
                        <div style="font-family:'Sora',sans-serif;font-size:22px;font-weight:700;color:${color};">${val}</div>
                        <div style="color:var(--text-muted);font-size:12px;margin-top:3px;">${label}</div>
                    </div>`
                ).join('')}
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:18px;">

                <!-- Mood tracker -->
                <div class="glass" style="border-radius:22px;padding:26px;" class="anim-fadeUp">
                    <h2 style="font-family:'Sora',sans-serif;font-size:17px;font-weight:600;margin-bottom:20px;">Track your mood</h2>
                    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:18px;">
                        ${moodOptions.map(o => `
                            <button onclick="selectMoodBtn(${o.value})" class="mood-btn" data-mood="${o.value}" style="border-radius:14px;padding:12px 4px;display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;">
                                <span style="font-size:22px;">${o.emoji}</span>
                                <span style="color:var(--text-secondary);font-size:11px;">${o.label}</span>
                            </button>`
                        ).join('')}
                    </div>
                    <textarea id="moodFeeling" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:13px;resize:none;margin-bottom:14px;" rows="3" placeholder="What's on your mind today? (optional)"></textarea>
                    <button id="submitMoodBtn" onclick="submitMood()" disabled class="btn-primary" style="width:100%;padding:12px;border-radius:10px;font-size:14px;cursor:pointer;opacity:0.4;" onmouseenter="if(!this.disabled)this.style.opacity='1'" onmouseleave="if(!this.disabled)this.style.opacity=''">
                        Record mood
                    </button>
                </div>

                <!-- Chart -->
                <div class="glass" style="border-radius:22px;padding:26px;">
                    <h2 style="font-family:'Sora',sans-serif;font-size:17px;font-weight:600;margin-bottom:20px;">Your mood trend</h2>
                    ${total
                        ? `<div style="height:220px;"><canvas id="moodChart"></canvas></div>`
                        : `<div style="height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
                              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(56,189,248,0.3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                              <p style="color:var(--text-muted);font-size:13px;text-align:center;">Track a few moods to see your trend here</p>
                           </div>`
                    }
                </div>
            </div>

            <!-- Recent entries -->
            <div class="glass" style="border-radius:22px;padding:26px;">
                <h2 style="font-family:'Sora',sans-serif;font-size:17px;font-weight:600;margin-bottom:18px;">Recent entries</h2>
                ${total
                    ? `<div style="display:flex;flex-direction:column;gap:10px;">
                        ${moodHistory.slice().reverse().slice(0,5).map(e => {
                            const mo = moodOptions.find(o => o.value === e.mood);
                            return `<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;background:rgba(8,40,70,0.4);border:1px solid rgba(56,189,248,0.1);">
                                <span style="font-size:24px;">${mo?.emoji}</span>
                                <div style="flex:1;min-width:0;">
                                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                                        <span style="color:var(--text-primary);font-size:14px;font-weight:500;font-family:'Sora',sans-serif;">${mo?.label}</span>
                                        <span style="color:var(--text-muted);font-size:12px;">${e.date}</span>
                                    </div>
                                    ${e.feeling ? `<p style="color:var(--text-secondary);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${e.feeling.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>` : ''}
                                </div>
                                <div style="width:8px;height:8px;border-radius:50%;background:${mo?.color};flex-shrink:0;box-shadow:0 0 6px ${mo?.color}60;"></div>
                            </div>`;
                        }).join('')}
                       </div>`
                    : `<div style="text-align:center;padding:32px 0;color:var(--text-muted);">
                            <div style="font-size:40px;margin-bottom:12px;">📝</div>
                            <p style="font-size:14px;">No entries yet — track your first mood above!</p>
                       </div>`
                }
            </div>
        </div>
    </div>`;
}
