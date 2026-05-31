import { Nav } from './Nav.js';

export function ProfilePage({ currentUser, moodHistory, moodOptions, chatMessages }) {
    const total = moodHistory.length;
    const avg = total ? (moodHistory.reduce((s, e) => s + e.mood, 0) / total).toFixed(1) : '—';
    const best = total ? moodOptions.find(o => o.value === Math.max(...moodHistory.map(e => e.mood)))?.label : '—';
    const userChats = chatMessages.filter(m => m.sender === 'user').length;

    // Load saved profile picture from localStorage
    const savedPic = `window.__profilePic_${currentUser?.id}`;

    return `${Nav('profile', currentUser)}
    <div style="padding-top:100px;padding-bottom:60px;padding-left:24px;padding-right:24px;min-height:100vh;">
        <div style="max-width:620px;margin:0 auto;" class="anim-fadeUp">
            <h1 style="font-family:'Sora',sans-serif;font-size:28px;font-weight:700;margin-bottom:28px;">My Profile</h1>

            <!-- Profile card -->
            <div class="glass" style="border-radius:22px;padding:32px 28px 28px;margin-bottom:18px;">

                <!-- Avatar upload section -->
                <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:28px;">

                    <!-- Round avatar with camera overlay -->
                    <div style="position:relative;width:110px;height:110px;margin-bottom:16px;">
                        <div id="profileAvatarRing" style="
                            width:110px;height:110px;border-radius:50%;
                            background:linear-gradient(135deg,#3b82f6,#2563eb);
                            padding:3px;
                            box-shadow:0 0 0 4px rgba(59,130,246,0.2), 0 8px 32px rgba(0,0,0,0.4);
                        ">
                            <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;background:#0f1b3c;">
                                <img
                                    id="profilePicImg"
                                    src=""
                                    alt=""
                                    style="width:100%;height:100%;object-fit:cover;display:none;border-radius:50%;"
                                />
                                <div id="profilePicInitial" style="
                                    width:100%;height:100%;border-radius:50%;
                                    display:flex;align-items:center;justify-content:center;
                                    font-family:'Sora',sans-serif;font-size:38px;font-weight:700;color:white;
                                    background:linear-gradient(135deg,#3b82f6,#2563eb);
                                ">
                                    ${currentUser?.name?.[0]?.toUpperCase() || '?'}
                                </div>
                            </div>
                        </div>

                        <!-- Camera button overlay -->
                        <button
                            onclick="document.getElementById('profilePicInput').click()"
                            title="Upload profile picture"
                            style="
                                position:absolute;bottom:2px;right:2px;
                                width:34px;height:34px;border-radius:50%;
                                background:linear-gradient(135deg,#3b82f6,#2563eb);
                                border:2px solid #0a1428;
                                display:flex;align-items:center;justify-content:center;
                                cursor:pointer;transition:all 0.2s;
                                box-shadow:0 2px 8px rgba(0,0,0,0.4);
                            "
                            onmouseover="this.style.transform='scale(1.1)'"
                            onmouseout="this.style.transform='scale(1)'"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                <circle cx="12" cy="13" r="4"/>
                            </svg>
                        </button>

                        <!-- Hidden file input -->
                        <input
                            type="file"
                            id="profilePicInput"
                            accept="image/*"
                            style="display:none;"
                            onchange="handleProfilePicUpload(event, '${currentUser?.id}')"
                        />
                    </div>

                    <!-- Name & email under avatar -->
                    <div style="text-align:center;">
                        <div style="font-family:'Sora',sans-serif;font-size:20px;font-weight:700;margin-bottom:4px;">
                            ${currentUser?.name}
                        </div>
                        <div style="color:var(--text-muted);font-size:13px;margin-bottom:8px;">
                            ${currentUser?.email}
                        </div>
                        <div class="badge" style="display:inline-block;font-size:11px;">Member</div>
                    </div>
                </div>

                <!-- Stats row -->
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;border-top:1px solid rgba(56,189,248,0.1);padding-top:20px;">
                    ${[
                        [total.toString(), 'Mood entries', '#60a5fa'],
                        [avg, 'Average mood', '#34d399'],
                        [userChats.toString(), 'Chat messages', '#a78bfa'],
                    ].map(([v, l, c]) => `
                        <div style="text-align:center;">
                            <div style="font-family:'Sora',sans-serif;font-size:22px;font-weight:700;color:${c};">${v}</div>
                            <div style="color:var(--text-muted);font-size:12px;margin-top:2px;">${l}</div>
                        </div>`
                    ).join('')}
                </div>
            </div>

            <!-- Wellness stats -->
            <div class="glass" style="border-radius:22px;padding:24px;margin-bottom:18px;">
                <h3 style="font-family:'Sora',sans-serif;font-size:16px;font-weight:600;margin-bottom:16px;">Wellness stats</h3>
                <div style="display:flex;flex-direction:column;gap:0;">
                    ${[
                        ['Best recorded mood', best],
                        ['Total mood entries', total.toString()],
                        ['Chat conversations', userChats.toString()],
                        ['Member since', new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })],
                    ].map(([l, v]) => `
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
                    <button
                        onclick="if(confirm('Clear all mood data?')){moodHistory=[];save();goto('profile');}"
                        class="btn-ghost"
                        style="padding:9px 18px;border-radius:9px;font-size:14px;cursor:pointer;color:#f87171;border-color:rgba(239,68,68,0.25);"
                    >
                        Clear mood history
                    </button>
                    <button
                        onclick="logout()"
                        class="btn-ghost"
                        style="padding:9px 18px;border-radius:9px;font-size:14px;cursor:pointer;"
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        // ── Load saved picture on page ready ────────────────────────────────
        (function() {
            const userId = '${currentUser?.id}';
            const saved  = localStorage.getItem('profile_pic_' + userId);
            if (saved) {
                const img     = document.getElementById('profilePicImg');
                const initial = document.getElementById('profilePicInitial');
                if (img && initial) {
                    img.src          = saved;
                    img.style.display    = 'block';
                    initial.style.display = 'none';
                }
            }
        })();

        // ── Handle file upload ────────────────────────────────────────────────
        function handleProfilePicUpload(event, userId) {
            const file = event.target.files[0];
            if (!file) return;

            // Validate: image only, max 5 MB
            if (!file.type.startsWith('image/')) {
                alert('Please choose an image file (JPG, PNG, GIF, WebP).');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Image must be smaller than 5 MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const dataUrl = e.target.result;

                // Show in the avatar circle
                const img     = document.getElementById('profilePicImg');
                const initial = document.getElementById('profilePicInitial');
                if (img && initial) {
                    img.src           = dataUrl;
                    img.style.display = 'block';
                    initial.style.display = 'none';
                }

                // Persist to localStorage so it survives page reload
                try {
                    localStorage.setItem('profile_pic_' + userId, dataUrl);
                } catch(storageErr) {
                    // If localStorage quota exceeded (large image), warn gracefully
                    console.warn('Could not save profile picture:', storageErr);
                    alert('Picture set for this session but could not be saved permanently — try a smaller image.');
                }
            };
            reader.readAsDataURL(file);
        }
    </script>`;
}
