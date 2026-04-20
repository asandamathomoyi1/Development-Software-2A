// ===== STATE =====
let currentUser = null, currentPage = 'landing';
let moodHistory = [], chatMessages = [];
let selectedMood = null, moodChart = null;

function save() {
    if (!currentUser) return;
    localStorage.setItem(`ms_mood_${currentUser.id}`, JSON.stringify(moodHistory));
    localStorage.setItem(`ms_chat_${currentUser.id}`, JSON.stringify(chatMessages));
}
function load() {
    if (!currentUser) return;
    const m = localStorage.getItem(`ms_mood_${currentUser.id}`);
    if (m) moodHistory = JSON.parse(m);
    const c = localStorage.getItem(`ms_chat_${currentUser.id}`);
    if (c) {
        chatMessages = JSON.parse(c);
    } else {
        chatMessages = [{ id: Date.now().toString(), text: `Hello ${currentUser.name} 🌊 I'm your Digital Mental Health Platform companion — a calm, private space to talk through anything. How are you feeling today?`, sender: 'bot', timestamp: Date.now() }];
        save();
    }
}

function login(email, password) {
    const users = JSON.parse(localStorage.getItem('ms_users') || '[]');
    const u = users.find(u => u.email === email && u.password === password);
    if (!u) return false;
    currentUser = { id: u.id, email: u.email, name: u.name };
    localStorage.setItem('ms_user', JSON.stringify(currentUser));
    moodHistory = []; chatMessages = []; load();
    goto('dashboard'); return true;
}
function syncUserToAdmin(user, password) {
    fetch('register.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, name: user.name, email: user.email, password })
    }).catch(() => {
        // Keep app working even if server sync fails
    });
}

function signup(name, email, password) {
    const users = JSON.parse(localStorage.getItem('ms_users') || '[]');
    if (users.some(u => u.email === email)) return false;
    const nu = { id: Date.now().toString(), name, email, password };
    users.push(nu); localStorage.setItem('ms_users', JSON.stringify(users));
    syncUserToAdmin(nu, password);
    goto('login'); return true;
}
function isPasswordStrong(password) {
    return typeof password === 'string'
        && password.length >= 8
        && /[0-9]/.test(password)
        && /[^A-Za-z0-9]/.test(password);
}
function logout() {
    currentUser = null; localStorage.removeItem('ms_user');
    moodHistory = []; chatMessages = []; goto('landing');
}
function goto(page) { currentPage = page; render(); window.scrollTo(0,0); }

const moodOptions = [
    { value:1, label:'Very Low', emoji:'😢', color:'#ef4444' },
    { value:2, label:'Low',      emoji:'😔', color:'#f97316' },
    { value:3, label:'Neutral',  emoji:'😐', color:'#eab308' },
    { value:4, label:'Good',     emoji:'😊', color:'#22c55e' },
    { value:5, label:'Great',    emoji:'😄', color:'#38bdf8' }
];
const moodLabels = {1:'Very Low',2:'Low',3:'Neutral',4:'Good',5:'Great'};

const botReplies = [
    "I'm here to listen — take your time. What's weighing on your mind right now?",
    "It's completely okay to feel this way. You don't have to figure it all out at once.",
    "Thank you for trusting me with that. How long have you been carrying these feelings?",
    "That sounds really tough. What's one small thing that might ease things a little today?",
    "Your feelings are real and they matter. What kind of support would feel most helpful right now?",
    "Sometimes just naming what we feel is the first step. You're doing something courageous by talking about it.",
    "I hear you. What does your body feel like when you experience this?",
    "You don't have to be okay all the time. What would feel like relief to you right now?"
];

function botResponse(input) {
    const i = input.toLowerCase();
    if (i.includes('sad') || i.includes('depressed') || i.includes('down') || i.includes('cry') || i.includes('hopeless'))
        return "I'm truly sorry you're feeling this way. Those emotions are heavy to carry. You're not alone in this — I'm here. Would you like to track this on your dashboard so we can watch for patterns together?";
    if (i.includes('happy') || i.includes('great') || i.includes('amazing') || i.includes('good'))
        return "That genuinely makes me happy to hear 🌿 These positive moments deserve to be remembered. What's been bringing the light in lately?";
    if (i.includes('anxious') || i.includes('anxiety') || i.includes('panic') || i.includes('worry') || i.includes('stress'))
        return "Anxiety can feel like a wave that won't stop. Try this: breathe in for 4 counts, hold for 7, breathe out for 8. Do that twice. Would you like to talk about what's been triggering this?";
    if (i.includes('sleep') || i.includes('tired') || i.includes('exhaust') || i.includes('rest'))
        return "Sleep and emotional wellbeing are deeply linked. When we're depleted, everything feels harder. Are you getting enough rest, and if not — what do you think is getting in the way?";
    if (i.includes('help') || i.includes('support') || i.includes('crisis') || i.includes('download') || i.includes('app'))
        return "I'm right here with you. If you want extra guided support, you have three great options: HelloBetter at https://hellobetter.de/en/ello/ , AuraMind at https://play.google.com/store/apps/details?id=com.zoony.auramind , or Nuom Health at https://www.nuom.health/your-business/healthcare-software/digital-solutions-for-mental-health . All offer download options and further assistance beyond this chat.";
    if (i.includes('mood') || i.includes('track'))
        return moodHistory.length
            ? `Your last recorded mood was ${moodLabels[moodHistory[moodHistory.length-1].mood].toLowerCase()} on ${moodHistory[moodHistory.length-1].date}. How are you feeling compared to then?`
            : "Head to the Dashboard to start tracking — even a few entries reveal really meaningful patterns about your emotional world.";
    return botReplies[Math.floor(Math.random() * botReplies.length)];
}

function escHtml(t) { return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function linkifyText(t) { return escHtml(t).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noreferrer" style="color:#38bdf8;text-decoration:underline;">$1</a>'); }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }

function updateProgressBar(inputId) {
    const input = document.getElementById(inputId);
    const progressBar = document.getElementById(inputId + 'Progress');
    if (!input || !progressBar) return;

    const value = input.value;
    let progress = 0;
    let colorClass = 'progress-red';

    if (input.type === 'email') {
        // Email progress: basic validation
        if (value.length > 0) progress = 33;
        if (value.includes('@')) progress = 66;
        if (value.includes('@') && value.includes('.') && value.length > 5) progress = 100;
    } else if (input.type === 'password') {
        // Password progress: length and complexity
        if (value.length > 0) progress = 20;
        if (value.length >= 4) progress = 40;
        if (value.length >= 8) progress = 60;
        if (value.length >= 8 && /\d/.test(value)) progress = 80;
        if (value.length >= 8 && /\d/.test(value) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) progress = 100;
    }

    // Set color based on progress
    if (progress >= 100) {
        colorClass = 'progress-green';
    } else if (progress >= 50) {
        colorClass = 'progress-orange';
    } else {
        colorClass = 'progress-red';
    }

    progressBar.style.width = progress + '%';
    progressBar.className = 'progress-bar ' + colorClass;
}

function renderChatMessages() {
    const el = document.getElementById('chatList');
    if (!el) return;
    el.innerHTML = chatMessages.map(m => m.sender === 'user'
        ? `<div class="flex gap-3 items-end justify-end anim-fadeUp">
              <div class="bubble-user rounded-2xl rounded-br-none px-4 py-3 max-w-xs backdrop-blur-md">
                  <p class="text-white text-sm leading-relaxed">${escHtml(m.text)}</p>
                  <p style="color:rgba(186,230,253,0.5);font-size:11px;margin-top:4px;">${fmtTime(m.timestamp)}</p>
              </div>
              <div class="w-8 h-8 rounded-full profile-avatar flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style="font-family:'Sora',sans-serif;">
                  ${currentUser.name[0].toUpperCase()}
              </div>
          </div>`
        : `<div class="flex gap-3 items-end anim-fadeUp">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#0ea5e9,#10b981);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div class="bubble-bot rounded-2xl rounded-bl-none px-4 py-3 max-w-xs backdrop-blur-md">
                  <p style="color:var(--text-primary);font-size:14px;line-height:1.6;">${linkifyText(m.text)}</p>
                  <p style="color:var(--text-muted);font-size:11px;margin-top:4px;">${fmtTime(m.timestamp)}</p>
              </div>
          </div>`
    ).join('');
    el.scrollTop = el.scrollHeight;
}

function sendChat(text) {
    if (!text.trim()) return;
    chatMessages.push({ id: Date.now().toString(), text, sender:'user', timestamp:Date.now() });
    save();
    renderChatMessages();
    const chatList = document.getElementById('chatList');
    if (chatList) {
        const typing = document.createElement('div');
        typing.id = 'typingIndicator';
        typing.className = 'flex gap-3 items-end';
        typing.innerHTML = `
            <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background:linear-gradient(135deg,#0ea5e9,#10b981);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div class="bubble-bot rounded-2xl rounded-bl-none px-4 py-3 flex gap-2 items-center">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>`;
        chatList.appendChild(typing);
        chatList.scrollTop = chatList.scrollHeight;
    }
    setTimeout(() => {
        document.getElementById('typingIndicator')?.remove();
        chatMessages.push({ id: (Date.now()+1).toString(), text:botResponse(text), sender:'bot', timestamp:Date.now() });
        save(); renderChatMessages();
    }, 1300);
}

function selectMoodBtn(val) {
    selectedMood = val;
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`.mood-btn[data-mood="${val}"]`)?.classList.add('selected');
    const btn = document.getElementById('submitMoodBtn');
    if (btn) btn.disabled = false;
}

function submitMood() {
    if (!selectedMood) return;
    moodHistory.push({ date: new Date().toLocaleDateString(), mood: selectedMood, feeling: document.getElementById('moodFeeling')?.value||'', timestamp: Date.now() });
    save(); selectedMood = null; goto('dashboard');
}

function buildChart() {
    const canvas = document.getElementById('moodChart');
    if (!canvas || !moodHistory.length) return;
    if (moodChart) { moodChart.destroy(); moodChart = null; }
    const last7 = moodHistory.slice(-7);
    moodChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: last7.map(e => e.date),
            datasets: [{
                label: 'Mood',
                data: last7.map(e => e.mood),
                borderColor: '#38bdf8',
                backgroundColor: (ctx) => {
                    const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
                    g.addColorStop(0, 'rgba(56,189,248,0.25)');
                    g.addColorStop(1, 'rgba(56,189,248,0.01)');
                    return g;
                },
                borderWidth: 2.5,
                pointBackgroundColor: '#38bdf8',
                pointBorderColor: 'rgba(3,13,23,0.8)',
                pointBorderWidth: 2,
                pointRadius: 5,
                tension: 0.45,
                fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { min:1, max:5,
                    ticks: { color:'rgba(147,210,244,0.6)', callback: v=>moodLabels[v]||'', font:{size:11,family:'DM Sans'} },
                    grid: { color:'rgba(56,189,248,0.06)' }
                },
                x: { ticks: { color:'rgba(147,210,244,0.6)', maxRotation:0, font:{size:11,family:'DM Sans'} }, grid: { color:'rgba(56,189,248,0.04)' } }
            }
        }
    });
}

function showError(el, msg) {
    if (!el) return;
    el.textContent = msg; el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4500);
}

function handleLogin() {
    const email = document.getElementById('loginEmail')?.value?.trim();
    const pw    = document.getElementById('loginPassword')?.value;
    const err   = document.getElementById('loginError');
    if (!email || !pw) { showError(err, 'Please fill in all fields.'); return; }
    if (login(email, pw)) {
        syncUserToAdmin(currentUser, pw);
    } else {
        showError(err, 'Incorrect email or password.');
    }
}
function handleSignup() {
    const name  = document.getElementById('signupName')?.value?.trim();
    const email = document.getElementById('signupEmail')?.value?.trim();
    const pw    = document.getElementById('signupPassword')?.value;
    const err   = document.getElementById('signupError');
    if (!name||!email||!pw) { showError(err,'Please fill in all fields.'); return; }
    if (!isPasswordStrong(pw)) { showError(err,'Password must be at least 8 characters and include one number and one special character.'); return; }
    if (signup(name,email,pw)) {
        showError(err,'Account created successfully! Please log in.');
        setTimeout(() => goto('login'), 1500);
    } else {
        showError(err,'An account with this email already exists.');
    }
}
function handleResetPassword() {
    const email = document.getElementById('resetEmail')?.value?.trim();
    const newPw = document.getElementById('resetNewPassword')?.value;
    const confirmPw = document.getElementById('resetConfirmPassword')?.value;
    const err   = document.getElementById('resetError');
    if (!email || !newPw || !confirmPw) { showError(err,'Please complete all fields.'); return; }
    if (newPw !== confirmPw) { showError(err,'New passwords do not match.'); return; }
    if (!isPasswordStrong(newPw)) { showError(err,'Password must be at least 8 characters and include one number and one special character.'); return; }
    const users = JSON.parse(localStorage.getItem('ms_users') || '[]');
    const user = users.find(u => u.email === email);
    if (!user) { showError(err,'No account found with that email address.'); return; }
    if (user.password === newPw) { showError(err,'Please choose a new password, not your old one.'); return; }
    user.password = newPw;
    localStorage.setItem('ms_users', JSON.stringify(users));
    showError(err,'Password has been reset. Please sign in now.');
    setTimeout(() => goto('login'), 1500);
}
function submitChat() {
    const inp = document.getElementById('chatInput');
    if (!inp) return;
    const t = inp.value.trim(); inp.value = '';
    if (t) sendChat(t);
}
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===== NAV =====
function Nav(page) {
    const auth = !!currentUser;
    return `
    <nav class="nav-glass fixed top-0 left-0 right-0 z-50">
        <div style="max-width:1200px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;">
            <button onclick="goto('${auth?'dashboard':'landing'}')" style="display:flex;align-items:center;gap:10px;background:none;border:none;cursor:pointer;">
                <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#0ea5e9,#10b981);display:flex;align-items:center;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <span style="font-family:'Sora',sans-serif;font-weight:600;font-size:16px;color:var(--text-primary);">Digital Mental Health Platform</span>
            </button>

            <div style="display:flex;align-items:center;gap:6px;">
                ${auth ? `
                    <button onclick="goto('dashboard')" class="nav-link ${page==='dashboard'?'active':''}">Dashboard</button>
                    <button onclick="goto('chatbot')" class="nav-link ${page==='chatbot'?'active':''}">AI Companion</button>
                    <button onclick="goto('profile')" class="nav-link ${page==='profile'?'active':''}">Profile</button>
                    <button onclick="logout()" class="btn-ghost" style="padding:7px 16px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:6px;">Sign out</button>
                ` : `
                    <button onclick="scrollToSection('features')" class="nav-link">Features</button>
                    <button onclick="scrollToSection('howItWorks')" class="nav-link">How it works</button>
                    <button onclick="goto('about')" class="nav-link">About</button>
                    <button onclick="goto('login')" class="btn-ghost" style="padding:7px 16px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:4px;">Log in</button>
                    <button onclick="goto('signup')" class="btn-primary" style="padding:8px 18px;border-radius:8px;font-size:14px;cursor:pointer;margin-left:2px;">Sign up free</button>
                `}
            </div>
        </div>
    </nav>`;
}

// ===== LANDING =====
function LandingPage() {
    return `${Nav('landing')}
    <div style="padding-top:80px;">

        <!-- Hero -->
        <section style="min-height:92vh;display:flex;align-items:center;justify-content:center;padding:80px 24px 60px;text-align:center;position:relative;">
            <div class="anim-fadeUp" style="max-width:760px;margin:0 auto;">
                <div class="badge anim-fadeUp" style="display:inline-block;margin-bottom:28px;">✦ Your ocean of calm</div>

                <h1 class="anim-fadeUp delay-1" style="font-family:'Sora',sans-serif;font-size:clamp(40px,6vw,72px);font-weight:700;line-height:1.1;margin-bottom:24px;letter-spacing:-0.02em;">
                    Mental wellness,<br><span class="text-aurora">clear as water</span>
                </h1>

                <p class="anim-fadeUp delay-2" style="font-size:18px;color:var(--text-secondary);line-height:1.7;max-width:500px;margin:0 auto 40px;">
                    Track your moods, talk to an AI companion, and discover the patterns that shape your emotional world — in a safe, private space.
                </p>

                <div class="anim-fadeUp delay-3" style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:60px;">
                    <button onclick="goto('signup')" class="btn-primary" style="padding:14px 32px;border-radius:12px;font-size:16px;cursor:pointer;">Start for free →</button>
                    <button onclick="scrollToSection('howItWorks')" class="btn-ghost" style="padding:14px 28px;border-radius:12px;font-size:16px;cursor:pointer;">See how it works</button>
                </div>

                <!-- Stats row -->
                <div class="anim-fadeUp delay-4" style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:420px;margin:0 auto;">
                    ${[['10k+','Active users'],['98%','Feel supported'],['24 / 7','AI companion']].map(([n,l]) => `
                        <div class="stat-card" style="padding:16px 10px;border-radius:14px;text-align:center;">
                            <div class="text-aurora" style="font-family:'Sora',sans-serif;font-size:22px;font-weight:700;">${n}</div>
                            <div style="color:var(--text-muted);font-size:12px;margin-top:2px;">${l}</div>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </section>

        <!-- Features -->
        <section id="features" style="padding:100px 24px;">
            <div style="max-width:1100px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:60px;">
                    <div class="badge" style="display:inline-block;margin-bottom:16px;">Features</div>
                    <h2 style="font-family:'Sora',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:14px;">Everything you need to feel better</h2>
                    <p style="color:var(--text-secondary);font-size:17px;max-width:480px;margin:0 auto;">Built for real people navigating the full spectrum of human emotion.</p>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
                    ${[
                        {icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`, bg:'icon-bg-teal', t:'Mood Tracking', d:'Daily mood logs with beautiful visual trends over time.'},
                        {icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`, bg:'icon-bg-green', t:'AI Companion', d:'Compassionate 24/7 conversations — never judgmental, always present.'},
                        {icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`, bg:'icon-bg-cyan', t:'Wellness Insights', d:'Pattern recognition and trend charts to understand yourself better.'},
                        {icon:`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`, bg:'icon-bg-violet', t:'Private & Secure', d:'Your data is encrypted and only ever yours.'},
                    ].map(f => `
                        <div class="feature-card" style="border-radius:20px;padding:28px 22px;backdrop-filter:blur(20px);">
                            <div class="${f.bg}" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:18px;">${f.icon}</div>
                            <h3 style="font-family:'Sora',sans-serif;font-size:16px;font-weight:600;margin-bottom:8px;color:var(--text-primary);">${f.t}</h3>
                            <p style="color:var(--text-secondary);font-size:14px;line-height:1.6;">${f.d}</p>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </section>

        <!-- How it works -->
        <section id="howItWorks" style="padding:100px 24px;">
            <div style="max-width:900px;margin:0 auto;text-align:center;">
                <div class="badge" style="display:inline-block;margin-bottom:16px;">How it works</div>
                <h2 style="font-family:'Sora',sans-serif;font-size:clamp(28px,4vw,44px);font-weight:700;margin-bottom:14px;">Start feeling better in minutes</h2>
                <p style="color:var(--text-secondary);font-size:17px;margin-bottom:60px;">No waitlists. No forms. Just sign up and begin.</p>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:28px;">
                    ${[
                        {n:'1',t:'Create your account',d:'Sign up free in under a minute — no credit card needed.'},
                        {n:'2',t:'Track your first mood',d:"Log how you're feeling and what's on your mind."},
                        {n:'3',t:'Chat with companion',d:'Talk to our AI any time — private, compassionate, always available.'},
                        {n:'4',t:'See your progress',d:'Watch your emotional patterns emerge and improve over time.'},
                    ].map(s => `
                        <div style="display:flex;flex-direction:column;align-items:center;gap:14px;">
                            <div class="step-num" style="width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700;">${s.n}</div>
                            <h3 style="font-family:'Sora',sans-serif;font-size:15px;font-weight:600;color:var(--text-primary);">${s.t}</h3>
                            <p style="color:var(--text-secondary);font-size:13px;line-height:1.6;">${s.d}</p>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </section>

        <!-- Testimonials -->
        <section style="padding:100px 24px;">
            <div style="max-width:1000px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:56px;">
                    <div class="badge" style="display:inline-block;margin-bottom:16px;">Stories</div>
                    <h2 style="font-family:'Sora',sans-serif;font-size:clamp(28px,4vw,40px);font-weight:700;">People who found their balance</h2>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;">
                    ${[
                        {q:"Tracking daily showed me how much sleep was affecting my anxiety. A genuine game changer.", name:"Sifundo Dube", role:"User since April 2026", init:"SD"},
                        {q:"The AI companion is non-judgmental. I talk to it on the nights I can't face anyone else.", name:"Cebolakhe Mlambo", role:"User since April 2026", init:"CM"},
                        {q:"Seeing my mood charts improve feels like real proof that healing is actually happening.", name:"Nkosinathi T", role:"User since April 2026", init:"NT"},
                    ].map(t => `
                        <div class="t-card" style="border-radius:20px;padding:24px;backdrop-filter:blur(20px);">
                            <div style="display:flex;gap:3px;margin-bottom:16px;">${'★★★★★'.split('').map(()=>`<span style="color:#f59e0b;font-size:13px;">★</span>`).join('')}</div>
                            <p style="color:var(--text-secondary);font-size:14px;line-height:1.7;font-style:italic;margin-bottom:20px;">"${t.q}"</p>
                            <div style="display:flex;align-items:center;gap:10px;">
                                <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#10b981);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:600;font-family:'Sora',sans-serif;">${t.init}</div>
                                <div>
                                    <div style="color:var(--text-primary);font-size:13px;font-weight:500;font-family:'Sora',sans-serif;">${t.name}</div>
                                    <div style="color:var(--text-muted);font-size:11px;">${t.role}</div>
                                </div>
                            </div>
                        </div>`
                    ).join('')}
                </div>
            </div>
        </section>

        <!-- CTA -->
        <section style="padding:80px 24px 120px;">
            <div style="max-width:640px;margin:0 auto;text-align:center;">
                <div class="glass" style="border-radius:28px;padding:60px 40px;">
                    <div style="font-size:48px;margin-bottom:20px;">🌊</div>
                    <h2 style="font-family:'Sora',sans-serif;font-size:clamp(26px,4vw,38px);font-weight:700;margin-bottom:12px;">Ready to begin your<br><span class="text-aurora">wellness journey?</span></h2>
                    <p style="color:var(--text-secondary);font-size:16px;margin-bottom:32px;">Join thousands building healthier emotional habits every day.</p>
                    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
                        <button onclick="goto('signup')" class="btn-primary" style="padding:14px 32px;border-radius:12px;font-size:15px;cursor:pointer;">Sign up — it's free</button>
                        <button onclick="goto('login')" class="btn-ghost" style="padding:14px 24px;border-radius:12px;font-size:15px;cursor:pointer;">Log in</button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer style="border-top:1px solid rgba(56,189,248,0.1);padding:28px 24px;">
            <div style="max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:26px;height:26px;border-radius:8px;background:linear-gradient(135deg,#0ea5e9,#10b981);display:flex;align-items:center;justify-content:center;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <span style="color:var(--text-muted);font-size:13px;">© 2026 Digital Mental Health Platform. All rights reserved.</span>
                </div>
                <div style="display:flex;gap:20px;">
                    ${['About','Privacy','Terms','Support'].map(l => `<button onclick="${l==='About'?'goto(\'about\')':`''`}" style="color:var(--text-muted);font-size:13px;background:none;border:none;cursor:pointer;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">${l}</button>`).join('')}
                </div>
            </div>
        </footer>
    </div>`;
}

function AboutPage() {
    return `${Nav('about')}
    <div style="padding-top:110px;padding-bottom:80px;padding-left:24px;padding-right:24px;min-height:100vh;">
        <div style="max-width:720px;margin:0 auto;" class="anim-fadeUp">
            <button onclick="goto('landing')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:14px;margin-bottom:36px;display:flex;align-items:center;gap:6px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Back to home</button>
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

function LoginPage() {
    return `${Nav('login')}
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:100px 24px 40px;">
        <div style="width:100%;max-width:420px;" class="anim-scaleIn">
            <div class="glass-2" style="border-radius:24px;padding:36px;">
                <div style="text-align:center;margin-bottom:32px;">
                    <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#0ea5e9,#10b981);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <h1 style="font-family:'Sora',sans-serif;font-size:24px;font-weight:700;margin-bottom:6px;">Welcome back</h1>
                    <p style="color:var(--text-muted);font-size:14px;">Continue your wellness journey</p>
                </div>

                <div style="display:flex;flex-direction:column;gap:18px;">
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Email address</label>
                        <input type="email" id="loginEmail" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="you@example.com" oninput="updateProgressBar('loginEmail')">
                        <div class="progress-container"><div id="loginEmailProgress" class="progress-bar"></div></div>
                    </div>
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Password</label>
                        <input type="password" id="loginPassword" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="Your password" onkeydown="if(event.key==='Enter')handleLogin()" oninput="updateProgressBar('loginPassword')">
                        <div class="progress-container"><div id="loginPasswordProgress" class="progress-bar"></div></div>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:-4px;">
                        <button onclick="goto('reset')" style="background:none;border:none;color:#38bdf8;font-size:13px;cursor:pointer;" onmouseover="this.style.color='#7dd3fc'" onmouseout="this.style.color='#38bdf8'">Forgot password?</button>
                        <span style="color:var(--text-muted);font-size:12px;">Must be new and strong</span>
                    </div>
                    <div id="loginError" style="color:#f87171;font-size:13px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:8px;" class="hidden"></div>
                    <button onclick="handleLogin()" class="btn-primary" style="width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;margin-top:4px;">Sign in</button>
                </div>

                <div style="margin-top:22px;text-align:center;">
                    <p style="color:var(--text-muted);font-size:13px;">Don't have an account? <button onclick="goto('signup')" style="background:none;border:none;cursor:pointer;color:#38bdf8;font-size:13px;" onmouseover="this.style.color='#7dd3fc'" onmouseout="this.style.color='#38bdf8'">Sign up free</button></p>
                </div>
                <div style="margin-top:10px;text-align:center;">
                    <button onclick="goto('landing')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:13px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Back to home</button>
                </div>
            </div>
        </div>
    </div>`;
}

function SignupPage() {
    return `${Nav('signup')}
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:100px 24px 40px;">
        <div style="width:100%;max-width:420px;" class="anim-scaleIn">
            <div class="glass-2" style="border-radius:24px;padding:36px;">
                <div style="text-align:center;margin-bottom:32px;">
                    <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#0ea5e9,#10b981);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <h1 style="font-family:'Sora',sans-serif;font-size:24px;font-weight:700;margin-bottom:6px;">Create your account</h1>
                    <p style="color:var(--text-muted);font-size:14px;">Start your mental wellness journey today</p>
                </div>

                <div style="display:flex;flex-direction:column;gap:16px;">
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Full name</label>
                        <input type="text" id="signupName" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="Your name">
                    </div>
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Email address</label>
                        <input type="email" id="signupEmail" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="you@example.com" oninput="updateProgressBar('signupEmail')">
                        <div class="progress-container"><div id="signupEmailProgress" class="progress-bar"></div></div>
                    </div>
                    <div>
                        <label style="display:block;font-size:13px;font-weight:500;color:var(--text-secondary);margin-bottom:7px;font-family:'Sora',sans-serif;">Password <span style="color:var(--text-muted);font-weight:400;">(min. 8 chars, include 1 number & 1 special character)</span></label>
                        <input type="password" id="signupPassword" class="input-glass" style="width:100%;border-radius:10px;padding:11px 14px;font-size:14px;" placeholder="Create a password" onkeydown="if(event.key==='Enter')handleSignup()" oninput="updateProgressBar('signupPassword')">
                        <div class="progress-container"><div id="signupPasswordProgress" class="progress-bar"></div></div>
                    </div>
                    <div id="signupError" style="color:#f87171;font-size:13px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);padding:10px 14px;border-radius:8px;" class="hidden"></div>
                    <button onclick="handleSignup()" class="btn-primary" style="width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;margin-top:4px;">Create free account</button>
                    <p style="color:var(--text-muted);font-size:12px;text-align:center;">By signing up you agree to our Terms and Privacy Policy.</p>
                </div>

                <div style="margin-top:18px;text-align:center;">
                    <p style="color:var(--text-muted);font-size:13px;">Already have an account? <button onclick="goto('login')" style="background:none;border:none;cursor:pointer;color:#38bdf8;font-size:13px;" onmouseover="this.style.color='#7dd3fc'" onmouseout="this.style.color='#38bdf8'">Sign in</button></p>
                </div>
                <div style="margin-top:10px;text-align:center;">
                    <button onclick="goto('landing')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);font-size:13px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Back to home</button>
                </div>
            </div>
        </div>
    </div>`;
}

function ResetPasswordPage() {
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
                    <p style="color:var(--text-muted);font-size:13px;">Remembered your password? <button onclick="goto('login')" style="background:none;border:none;cursor:pointer;color:#38bdf8;font-size:13px;" onmouseover="this.style.color='#7dd3fc'" onmouseout="this.style.color='#38bdf8'">Sign in</button></p>
                </div>
                <div style="margin-top:10px;text-align:center;">
                    <button onclick="goto('landing')" style="background:none;border:none;color:var(--text-muted);font-size:13px;" onmouseover="this.style.color='var(--text-secondary)'" onmouseout="this.style.color='var(--text-muted)'">← Back to home</button>
                </div>
            </div>
        </div>
    </div>`;
}

function DashboardPage() {
    const total = moodHistory.length;
    const avg = total ? (moodHistory.reduce((s,e)=>s+e.mood,0)/total).toFixed(1) : '—';
    const latest = total ? moodOptions.find(o=>o.value===moodHistory[moodHistory.length-1].mood) : null;

    return `${Nav('dashboard')}
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
                    ['Total entries', total.toString(), '#38bdf8'],
                    ['Avg mood', avg, '#34d399'],
                    ['Latest', latest?.emoji || '—', '#a78bfa'],
                ].map(([label,val,color]) => `
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
                            const mo = moodOptions.find(o=>o.value===e.mood);
                            return `<div style="display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:14px;background:rgba(8,40,70,0.4);border:1px solid rgba(56,189,248,0.1);">
                                <span style="font-size:24px;">${mo?.emoji}</span>
                                <div style="flex:1;min-width:0;">
                                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                                        <span style="color:var(--text-primary);font-size:14px;font-weight:500;font-family:'Sora',sans-serif;">${mo?.label}</span>
                                        <span style="color:var(--text-muted);font-size:12px;">${e.date}</span>
                                    </div>
                                    ${e.feeling ? `<p style="color:var(--text-secondary);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(e.feeling)}</p>` : ''}
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

function ChatbotPage() {
    return `${Nav('chatbot')}
    <div style="padding-top:64px;height:100vh;display:flex;flex-direction:column;">
        <!-- Chat header -->
        <div style="background:rgba(3,13,23,0.8);backdrop-filter:blur(30px);border-bottom:1px solid rgba(56,189,248,0.12);padding:16px 24px;display:flex;align-items:center;gap:14px;">
            <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#10b981);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div>
                <div style="font-family:'Sora',sans-serif;font-weight:600;font-size:15px;color:var(--text-primary);">Digital Mental Health Platform Companion</div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:7px;height:7px;border-radius:50%;background:#34d399;"></div>
                    <span style="color:var(--text-muted);font-size:12px;">Always here for you</span>
                </div>
            </div>
        </div>
        <div style="background:rgba(3,13,23,0.82);border-bottom:1px solid rgba(56,189,248,0.12);padding:10px 24px;text-align:center;">
            <a href="https://hellobetter.de/en/ello/" target="_blank" rel="noreferrer" class="btn-glass" style="padding:10px 18px;border-radius:12px;font-size:13px;">Open HelloBetter for app support</a>
        </div>

        <!-- Messages -->
        <div id="chatList" style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px;"></div>

        <!-- Input -->
        <div style="background:rgba(3,13,23,0.8);backdrop-filter:blur(30px);border-top:1px solid rgba(56,189,248,0.12);padding:16px 24px;">
            <div style="max-width:800px;margin:0 auto;display:flex;gap:10px;align-items:flex-end;">
                <textarea id="chatInput" class="input-glass" style="flex:1;border-radius:14px;padding:12px 16px;font-size:14px;resize:none;max-height:120px;line-height:1.5;"
                    rows="1" placeholder="Share what's on your mind..."
                    oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"
                    onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submitChat();}"></textarea>
                <button onclick="submitChat()" class="btn-primary" style="width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
            </div>
        </div>
    </div>`;
}

function ProfilePage() {
    const total = moodHistory.length;
    const avg = total ? (moodHistory.reduce((s,e)=>s+e.mood,0)/total).toFixed(1) : '—';
    const best = total ? moodOptions.find(o=>o.value===Math.max(...moodHistory.map(e=>e.mood)))?.label : '—';

    return `${Nav('profile')}
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
                        [total.toString(),'Mood entries','#38bdf8'],
                        [avg,'Average mood','#34d399'],
                        [chatMessages.filter(m=>m.sender==='user').length.toString(),'Chat messages','#a78bfa'],
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
                        ['Chat conversations', chatMessages.filter(m=>m.sender==='user').length.toString()],
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

// ===== RENDER =====
function render() {
    const app = document.getElementById('app');
    if (!app) return;

    if (currentUser && ['login','signup','landing'].includes(currentPage)) currentPage = 'dashboard';
    if (!currentUser && ['dashboard','chatbot','profile'].includes(currentPage)) currentPage = 'landing';

    switch(currentPage) {
        case 'landing':   app.innerHTML = LandingPage();   break;
        case 'about':     app.innerHTML = AboutPage();     break;
        case 'login':     app.innerHTML = LoginPage();     break;
        case 'signup':    app.innerHTML = SignupPage();    break;
        case 'reset':     app.innerHTML = ResetPasswordPage(); break;
        case 'dashboard': app.innerHTML = DashboardPage(); setTimeout(buildChart, 80); break;
        case 'chatbot':   app.innerHTML = ChatbotPage();   setTimeout(renderChatMessages, 50); break;
        case 'profile':   app.innerHTML = ProfilePage();   break;
        default:          app.innerHTML = LandingPage();
    }

    // Enable submit button after re-render if mood was selected
    const submitBtn = document.getElementById('submitMoodBtn');
    if (submitBtn && selectedMood) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        document.querySelector(`.mood-btn[data-mood="${selectedMood}"]`)?.classList.add('selected');
    }
}

// ===== INIT =====
(function() {
    const saved = localStorage.getItem('ms_user');
    if (saved) {
        try { currentUser = JSON.parse(saved); load(); currentPage = 'dashboard'; }
        catch(e) { localStorage.removeItem('ms_user'); }
    }
    render();
})();
