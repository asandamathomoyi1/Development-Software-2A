// ===== MAIN PAGE =====
console.log('MainPage.js module loaded');

import { LandingPage } from './pages/LandingPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { PrivacyPage } from './pages/PrivacyPage.js';
import { TermsPage } from './pages/TermsPage.js';
import { SupportPage } from './pages/SupportPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignupPage } from './pages/SignupPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ChatbotPage } from './pages/ChatbotPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { GamesHubPage } from './pages/GamesHubPage.js';
import {
  renderGamesHub,
  startGame,
  completeGame,
  exitGame,
  getRecommendedGames,
  initGamesHub,
  flipMemoryCard,
  puzzleTileClick,
  shufflePuzzle,
  checkPuzzleComplete,
  handlePuzzleCanvasClick,
  drawPuzzleCanvas,
  selectColor,
  colorSection,
  completeColoringGame,
  focusButtonPress,
  startFocusRound,
  selectTriviaAnswer,
  getGameState,
  getRandomMotivationalMessage,
} from './games-hub.js';

const BACKEND_URL = (() => {
  const origin = window.location.origin;
  if (origin.includes(':3001')) return origin;
  if (
    origin.startsWith('http://localhost') ||
    origin.startsWith('http://127.0.0.1')
  ) {
    return 'http://localhost:3001';
  }
  return origin;
})();

async function parseJsonResponse(response) {
  const raw = await response.text();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON response from server: ${raw.substr(0, 300)}`);
  }
}

async function fetchUserMoodEntries(userId) {
  const response = await fetch(
    `${BACKEND_URL}/mood-entries?userId=${encodeURIComponent(userId)}`
  );
  const data = await parseJsonResponse(response);
  if (!response.ok)
    throw new Error(data?.error || 'Could not load mood entries');
  return data.entries || [];
}

async function addMoodEntry(userId, mood, moodLabel, feeling) {
  const response = await fetch(`${BACKEND_URL}/mood-entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, mood, moodLabel, feeling }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.error || 'Could not save mood entry');
  return data;
}

// ===== STATE =====
let currentUser = null,
  currentPage = 'landing';
let moodHistory = [],
  chatMessages = [];
let selectedMood = null,
  moodChart = null;

function save() {
  if (!currentUser) return;
  localStorage.setItem(
    `ms_mood_${currentUser.id}`,
    JSON.stringify(moodHistory)
  );
  localStorage.setItem(
    `ms_chat_${currentUser.id}`,
    JSON.stringify(chatMessages)
  );
}
function load() {
  if (!currentUser) return;
  const m = localStorage.getItem(`ms_mood_${currentUser.id}`);
  if (m) moodHistory = JSON.parse(m);
  const c = localStorage.getItem(`ms_chat_${currentUser.id}`);
  if (c) {
    chatMessages = JSON.parse(c);
  } else {
    chatMessages = [
      {
        id: Date.now().toString(),
        text: `Hello ${currentUser.name} 🌊 I'm your Digital Mental Health Platform companion — a calm, private space to talk through anything. How are you feeling today?`,
        sender: 'bot',
        timestamp: Date.now(),
      },
    ];
    save();
  }
}

// ===== LOGIN FUNCTIONS =====
async function login(email, password) {
  try {
    const response = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data?.error || 'Login failed');

    currentUser = data.user;
    localStorage.setItem('ms_user', JSON.stringify(currentUser));

    // Load mood entries after login - with proper error handling
    try {
      const entries = await fetchUserMoodEntries(currentUser.id);
      moodHistory = entries.map((e) => ({
        date: e.date,
        mood: e.mood,
        feeling: e.feeling,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.warn('Could not load mood entries:', err);
      moodHistory = [];
    }

    goto('dashboard');
    return true;
  } catch (error) {
    showError(document.getElementById('loginError'), error.message);
    return false;
  }
}

async function signup(name, email, password) {
  try {
    const response = await fetch(`${BACKEND_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) throw new Error(data?.error || 'Registration failed');

    const loggedIn = await login(email, password);
    return loggedIn;
  } catch (error) {
    showError(document.getElementById('signupError'), error.message);
    return false;
  }
}

// ===== GOOGLE OAUTH - FIXED VERSION =====
async function handleGoogleCredentialResponse(response) {
  if (!response?.credential) {
    showError(
      document.getElementById('loginError') ||
        document.getElementById('signupError'),
      'Google sign-in failed. Please try again.'
    );
    return;
  }
  try {
    const res = await fetch(`${BACKEND_URL}/oauth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: response.credential }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data?.error || 'Google login failed');

    currentUser = data.user;
    localStorage.setItem('ms_user', JSON.stringify(currentUser));

    // FIX: Load mood entries AFTER login, don't block the UI, silent fail
    try {
      const entries = await fetchUserMoodEntries(currentUser.id);
      moodHistory = entries.map((e) => ({
        date: e.date,
        mood: e.mood,
        feeling: e.feeling,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.warn('Mood entries not available yet, using empty history:', err);
      moodHistory = [];
    }

    load();
    goto('dashboard');
  } catch (error) {
    console.error('Google login error:', error);
    showError(
      document.getElementById('loginError') ||
        document.getElementById('signupError'),
      error.message || 'Google sign-in failed.'
    );
  }
}

function isPasswordStrong(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function logout() {
  currentUser = null;
  localStorage.removeItem('ms_user');
  moodHistory = [];
  chatMessages = [];
  goto('landing');
}

function goto(page) {
  currentPage = page;
  render();
  window.scrollTo(0, 0);
}

const moodOptions = [
  { value: 1, label: 'Very Low', emoji: '😢', color: '#ef4444' },
  { value: 2, label: 'Low', emoji: '😔', color: '#f97316' },
  { value: 3, label: 'Neutral', emoji: '😐', color: '#eab308' },
  { value: 4, label: 'Good', emoji: '😊', color: '#22c55e' },
  { value: 5, label: 'Great', emoji: '😄', color: '#38bdf8' },
];
const moodLabels = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Great',
};

const botReplies = [
  "I'm here to listen — take your time. What's weighing on your mind right now?",
  "It's completely okay to feel this way. You don't have to figure it all out at once.",
  'Thank you for trusting me with that. How long have you been carrying these feelings?',
  "That sounds really tough. What's one small thing that might ease things a little today?",
  'Your feelings are real and they matter. What kind of support would feel most helpful right now?',
  "Sometimes just naming what we feel is the first step. You're doing something courageous by talking about it.",
  'I hear you. What does your body feel like when you experience this?',
  "You don't have to be okay all the time. What would feel like relief to you right now?",
];

function botResponse(input) {
  const i = input.toLowerCase();
  if (
    i.includes('sad') ||
    i.includes('depressed') ||
    i.includes('down') ||
    i.includes('cry') ||
    i.includes('hopeless')
  )
    return "I'm truly sorry you're feeling this way. Those emotions are heavy to carry. You're not alone in this — I'm here. Would you like to track this on your dashboard so we can watch for patterns together?";
  if (
    i.includes('happy') ||
    i.includes('great') ||
    i.includes('amazing') ||
    i.includes('good')
  )
    return "That genuinely makes me happy to hear 🌿 These positive moments deserve to be remembered. What's been bringing the light in lately?";
  if (
    i.includes('anxious') ||
    i.includes('anxiety') ||
    i.includes('panic') ||
    i.includes('worry') ||
    i.includes('stress')
  )
    return "Anxiety can feel like a wave that won't stop. Try this: breathe in for 4 counts, hold for 7, breathe out for 8. Do that twice. Would you like to talk about what's been triggering this?";
  if (
    i.includes('sleep') ||
    i.includes('tired') ||
    i.includes('exhaust') ||
    i.includes('rest')
  )
    return "Sleep and emotional wellbeing are deeply linked. When we're depleted, everything feels harder. Are you getting enough rest, and if not — what do you think is getting in the way?";
  if (
    i.includes('help') ||
    i.includes('support') ||
    i.includes('crisis') ||
    i.includes('download') ||
    i.includes('app')
  )
    return "I'm right here with you. If you want extra guided support, you have three great options: HelloBetter at https://hellobetter.de/en/ello/ , AuraMind at https://play.google.com/store/apps/details?id=com.zoony.auramind , or Nuom Health at https://www.nuom.health/your-business/healthcare-software/digital-solutions-for-mental-health . All offer download options and further assistance beyond this chat.";
  if (i.includes('mood') || i.includes('track'))
    return moodHistory.length
      ? `Your last recorded mood was ${moodLabels[moodHistory[moodHistory.length - 1].mood].toLowerCase()} on ${moodHistory[moodHistory.length - 1].date}. How are you feeling compared to then?`
      : 'Head to the Dashboard to start tracking — even a few entries reveal really meaningful patterns about your emotional world.';
  return botReplies[Math.floor(Math.random() * botReplies.length)];
}

function escHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function linkifyText(t) {
  return escHtml(t).replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer" style="color:#60a5fa;text-decoration:underline;">$1</a>'
  );
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function updateProgressBar(inputId) {
  const input = document.getElementById(inputId);
  const progressBar = document.getElementById(inputId + 'Progress');
  if (!input || !progressBar) return;

  const value = input.value;
  let progress = 0;
  let colorClass = 'progress-red';

  if (input.type === 'email') {
    if (value.length > 0) progress = 33;
    if (value.includes('@')) progress = 66;
    if (value.includes('@') && value.includes('.') && value.length > 5)
      progress = 100;
  } else if (input.type === 'password') {
    if (value.length > 0) progress = 20;
    if (value.length >= 4) progress = 40;
    if (value.length >= 8) progress = 60;
    if (value.length >= 8 && /\d/.test(value)) progress = 80;
    if (
      value.length >= 8 &&
      /\d/.test(value) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)
    )
      progress = 100;
  }

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
  el.innerHTML = chatMessages
    .map((m) =>
      m.sender === 'user'
        ? `<div class="flex gap-3 items-end justify-end anim-fadeUp">
              <div class="bubble-user rounded-2xl rounded-br-none px-4 py-3 max-w-xs backdrop-blur-md">
                  <p class="text-white text-sm leading-relaxed">${escHtml(m.text)}</p>
                  <p style="color:rgba(186,230,253,0.5);font-size:11px;margin-top:4px;">${fmtTime(m.timestamp)}</p>
              </div>
              <div class="w-8 h-8 rounded-full profile-avatar flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style="font-family:'Sora',sans-serif;">
                  ${currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
          </div>`
        : `<div class="flex gap-3 items-end anim-fadeUp">
              <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style="background:linear-gradient(135deg,#3b82f6,#2563eb);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </div>
              <div class="bubble-bot rounded-2xl rounded-bl-none px-4 py-3 max-w-xs backdrop-blur-md">
                  <p style="color:var(--text-primary);font-size:14px;line-height:1.6;">${linkifyText(m.text)}</p>
                  <p style="color:var(--text-muted);font-size:11px;margin-top:4px;">${fmtTime(m.timestamp)}</p>
              </div>
          </div>`
    )
    .join('');
  el.scrollTop = el.scrollHeight;
}

// ===== FIXED AI COMPANION - WORKING VERSION =====
async function sendChat(text) {
  if (!text.trim()) return;

  chatMessages.push({
    id: Date.now().toString(),
    text,
    sender: 'user',
    timestamp: Date.now(),
  });
  save();
  renderChatMessages();

  const chatList = document.getElementById('chatList');
  if (chatList) {
    const typing = document.createElement('div');
    typing.id = 'typingIndicator';
    typing.className = 'flex gap-3 items-end';
    typing.innerHTML = `
      <div class="w-8 h-8 rounded-full flex items-center justify-center" style="background:linear-gradient(135deg,#3b82f6,#2563eb);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </div>
      <div class="bubble-bot rounded-2xl rounded-bl-none px-4 py-3">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>`;
    chatList.appendChild(typing);
    chatList.scrollTop = chatList.scrollHeight;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, userId: currentUser?.id }),
    });
    const data = await response.json();
    document.getElementById('typingIndicator')?.remove();

    const reply = data.reply || botResponse(text);

    chatMessages.push({
      id: (Date.now() + 1).toString(),
      text: reply,
      sender: 'bot',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    document.getElementById('typingIndicator')?.remove();
    chatMessages.push({
      id: (Date.now() + 1).toString(),
      text: botResponse(text),
      sender: 'bot',
      timestamp: Date.now(),
    });
  }

  save();
  renderChatMessages();
}

function selectMoodBtn(val) {
  selectedMood = val;
  document
    .querySelectorAll('.mood-btn')
    .forEach((b) => b.classList.remove('selected'));
  const selectedBtn = document.querySelector(`.mood-btn[data-mood="${val}"]`);
  selectedBtn?.classList.add('selected');
  const btn = document.getElementById('submitMoodBtn');
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

async function submitMood() {
  if (!selectedMood || !currentUser) return;
  const feeling = document.getElementById('moodFeeling')?.value || '';
  const moodLabels = {
    1: 'Very Low',
    2: 'Low',
    3: 'Neutral',
    4: 'Good',
    5: 'Great',
  };

  try {
    await addMoodEntry(
      currentUser.id,
      selectedMood,
      moodLabels[selectedMood],
      feeling
    );

    moodHistory.unshift({
      date: new Date().toLocaleDateString(),
      mood: selectedMood,
      feeling: feeling,
      timestamp: Date.now(),
    });

    save();
    selectedMood = null;
    showMoodSaved();
    goto('dashboard');
  } catch (error) {
    console.error('Error saving mood:', error);
    showToast('Failed to save mood. Please try again.', 'error');
  }
}

function getGamesHubLoadingHtml() {
  return `
    <div class="loading-overlay">
      <div style="text-align:center;">
        <div class="spinner"></div>
        <p class="loading-text">Loading games... please wait.</p>
      </div>
    </div>
  `;
}

function showGamesHubLoading() {
  const gamesRoot = document.getElementById('gamesHubRoot');
  if (gamesRoot) {
    gamesRoot.innerHTML = getGamesHubLoadingHtml();
  }
}

function showMoodSaved() {
  showToast('Mood recorded successfully!', 'success');
}

function buildChart() {
  const canvas = document.getElementById('moodChart');
  if (!canvas || !moodHistory.length) return;
  if (moodChart) {
    moodChart.destroy();
    moodChart = null;
  }
  const last7 = moodHistory.slice(-7);
  moodChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: last7.map((e) => e.date),
      datasets: [
        {
          label: 'Mood',
          data: last7.map((e) => e.mood),
          borderColor: '#60a5fa',
          backgroundColor: (ctx) => {
            const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
            g.addColorStop(0, 'rgba(56,189,248,0.25)');
            g.addColorStop(1, 'rgba(56,189,248,0.01)');
            return g;
          },
          borderWidth: 2.5,
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: 'rgba(3,13,23,0.8)',
          pointBorderWidth: 2,
          pointRadius: 5,
          tension: 0.45,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          min: 1,
          max: 5,
          ticks: {
            color: 'rgba(147,210,244,0.6)',
            callback: (v) => moodLabels[v] || '',
            font: { size: 11, family: 'DM Sans' },
          },
          grid: { color: 'rgba(56,189,248,0.06)' },
        },
        x: {
          ticks: {
            color: 'rgba(147,210,244,0.6)',
            maxRotation: 0,
            font: { size: 11, family: 'DM Sans' },
          },
          grid: { color: 'rgba(56,189,248,0.04)' },
        },
      },
    },
  });
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4500);
}

function ensureToastContainer() {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

function showToast(message, type = 'success') {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-12px)';
  }, 3200);
  setTimeout(() => {
    toast.remove();
  }, 3800);
}

async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const pw = document.getElementById('loginPassword')?.value;
  const err = document.getElementById('loginError');
  if (!email || !pw) {
    showError(err, 'Please fill in all fields.');
    return;
  }

  const success = await login(email, pw);
  if (!success) {
    showError(err, 'Incorrect email or password.');
  }
}

async function handleSignup() {
  const name = document.getElementById('signupName')?.value?.trim();
  const email = document.getElementById('signupEmail')?.value?.trim();
  const pw = document.getElementById('signupPassword')?.value;
  const err = document.getElementById('signupError');
  if (!name || !email || !pw) {
    showError(err, 'Please fill in all fields.');
    return;
  }
  if (!isPasswordStrong(pw)) {
    showError(
      err,
      'Password must be at least 8 characters and include one number and one special character.'
    );
    return;
  }

  const success = await signup(name, email, pw);
  if (success) {
    showError(err, 'Account created successfully! You are signed in.');
    setTimeout(() => goto('dashboard'), 1200);
  } else {
    showError(err, 'An account with this email already exists.');
  }
}

function handleResetPassword() {
  const email = document.getElementById('resetEmail')?.value?.trim();
  const newPw = document.getElementById('resetNewPassword')?.value;
  const confirmPw = document.getElementById('resetConfirmPassword')?.value;
  const err = document.getElementById('resetError');
  if (!email || !newPw || !confirmPw) {
    showError(err, 'Please complete all fields.');
    return;
  }
  if (newPw !== confirmPw) {
    showError(err, 'New passwords do not match.');
    return;
  }
  if (!isPasswordStrong(newPw)) {
    showError(
      err,
      'Password must be at least 8 characters and include one number and one special character.'
    );
    return;
  }
  const users = JSON.parse(localStorage.getItem('ms_users') || '[]');
  const user = users.find((u) => u.email === email);
  if (!user) {
    showError(err, 'No account found with that email address.');
    return;
  }
  if (user.password === newPw) {
    showError(err, 'Please choose a new password, not your old one.');
    return;
  }
  user.password = newPw;
  localStorage.setItem('ms_users', JSON.stringify(users));
  showError(err, 'Password has been reset. Please sign in now.');
  setTimeout(() => goto('login'), 1500);
}

async function submitChat() {
  const inp = document.getElementById('chatInput');
  if (!inp) return;
  const t = inp.value.trim();
  inp.value = '';
  if (t) await sendChat(t);
}

function scrollToSection(id) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail')?.value?.trim();
  const msg = document.getElementById('newsletterMessage');
  if (!email) {
    msg.textContent = 'Please enter your email address.';
    msg.style.backgroundColor = 'rgba(239,68,68,0.1)';
    msg.style.color = '#f87171';
    msg.style.display = 'block';
    setTimeout(() => (msg.style.display = 'none'), 4000);
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    msg.textContent = 'Please enter a valid email address.';
    msg.style.backgroundColor = 'rgba(239,68,68,0.1)';
    msg.style.color = '#f87171';
    msg.style.display = 'block';
    setTimeout(() => (msg.style.display = 'none'), 4000);
    return;
  }

  let subscribers = JSON.parse(localStorage.getItem('ms_newsletter') || '[]');
  if (!subscribers.some((s) => s === email)) {
    subscribers.push(email);
    localStorage.setItem('ms_newsletter', JSON.stringify(subscribers));
  }

  msg.textContent =
    '✓ Thank you for subscribing! Check your inbox for a welcome email.';
  msg.style.backgroundColor = 'rgba(34,197,94,0.1)';
  msg.style.color = '#22c55e';
  msg.style.display = 'block';
  document.getElementById('newsletterEmail').value = '';
  setTimeout(() => (msg.style.display = 'none'), 4000);
}

function initNewFeatures() {
  // Initialize any dashboard-specific features
  if (currentUser && currentPage === 'dashboard') {
    console.log('Dashboard initialized for user:', currentUser.name);
  }
}

// ===== GAMES HUB PAGE COMPONENT =====
const GamesHubPageComponent = (currentUser) => GamesHubPage(currentUser);

// ===== RENDER =====
function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (currentUser && ['login', 'signup', 'landing'].includes(currentPage))
    currentPage = 'dashboard';
  if (
    !currentUser &&
    ['dashboard', 'chatbot', 'profile', 'games'].includes(currentPage)
  )
    currentPage = 'landing';

  switch (currentPage) {
    case 'landing':
      app.innerHTML = LandingPage();
      setTimeout(() => {
        if (window.google?.accounts?.id) {
          renderGoogleButtons();
        }
      }, 100);
      break;
    case 'about':
      app.innerHTML = AboutPage();
      break;
    case 'login':
      app.innerHTML = LoginPage();
      setTimeout(() => renderGoogleButtons(), 50);
      break;
    case 'signup':
      app.innerHTML = SignupPage();
      setTimeout(() => renderGoogleButtons(), 50);
      break;
    case 'reset':
      app.innerHTML = ResetPasswordPage();
      break;
    case 'dashboard':
      app.innerHTML = DashboardPage({ currentUser, moodHistory, moodOptions });
      setTimeout(buildChart, 80);
      setTimeout(initNewFeatures, 100);
      break;
    case 'chatbot':
      app.innerHTML = ChatbotPage(currentUser);
      setTimeout(renderChatMessages, 50);
      break;
    case 'profile':
      app.innerHTML = ProfilePage({
        currentUser,
        moodHistory,
        moodOptions,
        chatMessages,
      });
      break;
    case 'privacy':
      app.innerHTML = PrivacyPage();
      break;
    case 'terms':
      app.innerHTML = TermsPage();
      break;
    case 'support':
      app.innerHTML = SupportPage();
      break;
    case 'games':
      app.innerHTML = GamesHubPageComponent(currentUser);
      setTimeout(() => {
        const gamesRoot = document.getElementById('gamesHubRoot');
        if (gamesRoot) {
          gamesRoot.innerHTML = getGamesHubLoadingHtml();
        }
        setTimeout(() => {
          if (typeof initGamesHub === 'function') {
            initGamesHub(currentUser);
          }
          const gamesRootReady = document.getElementById('gamesHubRoot');
          if (gamesRootReady && typeof renderGamesHub === 'function') {
            gamesRootReady.innerHTML = renderGamesHub();
          }
          setupGamesHubEventListeners();
        }, 200);
      }, 50);
      break;
    default:
      app.innerHTML = LandingPage();
  }

  // Enable submit button after re-render if mood was selected
  const submitBtn = document.getElementById('submitMoodBtn');
  if (submitBtn && selectedMood) {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    document
      .querySelector(`.mood-btn[data-mood="${selectedMood}"]`)
      ?.classList.add('selected');
  }
}

function initGoogleSignInMainPage() {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    google.accounts.id.initialize({
      client_id:
        '55967579577-p1417ojnj57okrjdivfoqcvvc7vct445.apps.googleusercontent.com',
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    renderGoogleButtons();
  }
}

function renderGoogleButtons() {
  if (!(window.google && window.google.accounts && window.google.accounts.id))
    return;
  const loginButton = document.getElementById('googleLoginButton');
  const signupButton = document.getElementById('googleSignupButton');
  if (loginButton) {
    google.accounts.id.renderButton(loginButton, {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'signin_with',
    });
  }
  if (signupButton) {
    google.accounts.id.renderButton(signupButton, {
      theme: 'outline',
      size: 'large',
      width: '100%',
      text: 'signup_with',
    });
  }
}

function setupGamesHubEventListeners() {
  console.log('Games Hub event listeners initialized');

  // Expose game functions to window for inline handlers
  window.startGame = (gameId) => {
    const gamesRoot = document.getElementById('gamesHubRoot');
    if (gamesRoot && typeof startGame === 'function') {
      gamesRoot.innerHTML = startGame(gameId);
      setTimeout(() => {
        window.drawPuzzleCanvas?.();
        window.startFocusRound?.();
      }, 80);
    }
  };

  window.exitGame = () => {
    showGamesHubLoading();
    setTimeout(() => {
      if (typeof initGamesHub === 'function') initGamesHub(currentUser);
      const gamesRoot = document.getElementById('gamesHubRoot');
      if (gamesRoot && typeof renderGamesHub === 'function') {
        gamesRoot.innerHTML = renderGamesHub();
        setupGamesHubEventListeners();
      }
    }, 180);
  };

  window.completeGame = async (points) => {
    const gamesRoot = document.getElementById('gamesHubRoot');
    if (gamesRoot && typeof completeGame === 'function') {
      const result = await completeGame(points);
      if (result) gamesRoot.innerHTML = result;
    }
  };

  window.showGamesHub = () => {
    showGamesHubLoading();
    setTimeout(() => {
      if (typeof initGamesHub === 'function') initGamesHub(currentUser);
      const gamesRoot = document.getElementById('gamesHubRoot');
      if (gamesRoot && typeof renderGamesHub === 'function') {
        gamesRoot.innerHTML = renderGamesHub();
        setupGamesHubEventListeners();
        setTimeout(() => {
          window.drawPuzzleCanvas?.();
          window.startFocusRound?.();
        }, 80);
      }
    }, 180);
  };

  window.selectGameMood = (mood) => {
    if (typeof getRecommendedGames === 'function') {
      const recommended = getRecommendedGames(mood);
      console.log(`Mood ${mood} selected. Recommended games:`, recommended);
      // Optionally highlight recommended games in UI
    }
  };

  window.flipMemoryCard = flipMemoryCard;
  window.puzzleTileClick = puzzleTileClick;
  window.shufflePuzzle = shufflePuzzle;
  window.checkPuzzleComplete = checkPuzzleComplete;
  window.handlePuzzleCanvasClick = handlePuzzleCanvasClick;
  window.drawPuzzleCanvas = drawPuzzleCanvas;
  window.selectColor = selectColor;
  window.colorSection = colorSection;
  window.completeColoringGame = completeColoringGame;
  window.focusButtonPress = focusButtonPress;
  window.startFocusRound = startFocusRound;
  window.selectTriviaAnswer = selectTriviaAnswer;

  window.getRandomMotivationalMessage = getRandomMotivationalMessage;
}

// ===== INIT =====
(function () {
  const saved = localStorage.getItem('ms_user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      load();
      currentPage = 'dashboard';
    } catch (e) {
      localStorage.removeItem('ms_user');
    }
  }
  render();
})();

// Expose functions to global scope for inline onclick handlers
window.goto = goto;
window.backToDashboard = () => goto('dashboard');
window.subscribeNewsletter = subscribeNewsletter;
window.logout = logout;
window.scrollToSection = scrollToSection;
window.submitChat = submitChat;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleResetPassword = handleResetPassword;
window.selectMoodBtn = selectMoodBtn;
window.submitMood = submitMood;
window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;
window.initGoogleSignInMainPage = initGoogleSignInMainPage;
window.save = save;
window.load = load;
window.sendChat = sendChat;
window.botResponse = botResponse;
window.updateProgressBar = updateProgressBar;
window.initGamesHub = initGamesHub;
window.renderGamesHub = renderGamesHub;
window.getRecommendedGames = getRecommendedGames;
window.getGameState = getGameState;
window.getRandomMotivationalMessage = getRandomMotivationalMessage;
