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
        text: `Hello ${currentUser.name} 🌊 I'm your Calm Companion — a safe, private space to talk through anything. How are you feeling today?`,
        sender: 'bot',
        timestamp: Date.now(),
      },
    ];
    save();
  }
}

// ===== LOGIN FUNCTION =====
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
    const entries = await fetchUserMoodEntries(currentUser.id);
    moodHistory = entries.map((e) => ({
      date: e.date,
      mood: e.mood,
      feeling: e.feeling,
      timestamp: Date.now(),
    }));

    goto('dashboard');
    return true;
  } catch (error) {
    showError(document.getElementById('loginError'), error.message);
    return false;
  }
}

// ===== SIGNUP FUNCTION =====
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

// ===== GOOGLE OAUTH =====
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
    const entries = await fetchUserMoodEntries(currentUser.id);
    moodHistory = entries.map((e) => ({
      date: e.date,
      mood: e.mood,
      feeling: e.feeling,
      timestamp: Date.now(),
    }));

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

// ===== LOGOUT FUNCTION =====
function logout() {
  currentUser = null;
  localStorage.removeItem('ms_user');
  moodHistory = [];
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

// Gemini AI powered responses
async function getGeminiResponse(userMessage) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        userId: currentUser?.id,
        persona: 'warm',
      }),
    });
    const data = await response.json();
    if (data.success && data.reply) {
      return data.reply;
    }
    throw new Error('No response from AI');
  } catch (error) {
    console.error('Gemini API error:', error);
    return "I'm here for you. Could you please rephrase that? 💙";
  }
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
                  ${currentUser.name[0].toUpperCase()}
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </div>
            <div class="bubble-bot rounded-2xl rounded-bl-none px-4 py-3 flex gap-2 items-center">
                <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            </div>`;
    chatList.appendChild(typing);
    chatList.scrollTop = chatList.scrollHeight;
  }

  const aiResponse = await getGeminiResponse(text);
  document.getElementById('typingIndicator')?.remove();

  chatMessages.push({
    id: (Date.now() + 1).toString(),
    text: aiResponse,
    sender: 'bot',
    timestamp: Date.now(),
  });

  save();
  renderChatMessages();
}

function selectMoodBtn(val) {
  selectedMood = val;
  document
    .querySelectorAll('.mood-btn')
    .forEach((b) => b.classList.remove('selected'));
  document
    .querySelector(`.mood-btn[data-mood="${val}"]`)
    ?.classList.add('selected');
  const btn = document.getElementById('submitMoodBtn');
  if (btn) btn.disabled = false;
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
    goto('dashboard');
  } catch (error) {
    console.error('Error saving mood:', error);
    alert('Failed to save mood. Please try again.');
  }
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

  msg.textContent = '✓ Thank you for subscribing! You will receive updates.';
  msg.style.backgroundColor = 'rgba(34,197,94,0.1)';
  msg.style.color = '#22c55e';
  msg.style.display = 'block';
  document.getElementById('newsletterEmail').value = '';
  setTimeout(() => (msg.style.display = 'none'), 4000);
}

// ============================================
// ===== NEW FEATURES FOR MENTAL HEALTH APP =====
// ============================================

// Helper function to get current user ID
function getCurrentUserId() {
  return (
    currentUser?.id ||
    localStorage.getItem('userId') ||
    'test-user-' + Date.now()
  );
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showNotificationMessage(message) {
  const notification = document.createElement('div');
  notification.style.cssText =
    'position: fixed; top: 20px; right: 20px; background: #4CAF50; color: white; padding: 12px 24px; border-radius: 8px; z-index: 10001; animation: fadeIn 0.3s ease;';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// ===== 1. CALMING TOOLBOX FUNCTIONS =====
async function loadToolbox() {
  const userId = getCurrentUserId();
  try {
    const response = await fetch(`${BACKEND_URL}/api/toolbox/${userId}`);
    const items = await response.json();
    const container = document.getElementById('toolboxContainer');

    if (!container) return;

    if (!items.length) {
      container.innerHTML =
        '<p class="text-text-muted col-span-2 text-center py-4">✨ Save calming exercises or AI responses here</p>';
      return;
    }

    container.innerHTML = items
      .map(
        (item) => `
            <div class="rounded-xl p-3 flex justify-between items-center" style="background: rgba(0,0,0,0.2);">
                <div>
                    <div class="font-semibold">${escapeHtml(item.title)}</div>
                    <div class="text-xs" style="color: var(--text-muted);">${item.type}</div>
                </div>
                <button onclick="window.activateToolboxItem('${item.id}', '${item.type}', ${JSON.stringify(item.content)})" class="btn-glass px-3 py-1 rounded-lg text-sm">Activate</button>
            </div>
        `
      )
      .join('');
  } catch (error) {
    console.error('Error loading toolbox:', error);
  }
}

async function saveToToolbox(title, type, content) {
  const userId = getCurrentUserId();
  try {
    const response = await fetch(`${BACKEND_URL}/api/toolbox/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, title, type, content }),
    });
    if (response.ok) {
      await loadToolbox();
      showNotificationMessage(`💾 "${title}" saved to your toolbox!`);
      return true;
    }
  } catch (error) {
    console.error('Error saving to toolbox:', error);
    showNotificationMessage('Failed to save to toolbox');
  }
  return false;
}

window.activateToolboxItem = function (id, type, content) {
  if (type === 'breathing') {
    startBreathingExercise(parseInt(content) || 30);
  } else if (type === 'ai_response') {
    const chatDiv = document.getElementById('chatMessages');
    if (chatDiv) {
      chatDiv.innerHTML += `<div class="bubble-bot rounded-2xl p-3 mb-2 max-w-[85%]" style="background: rgba(20, 50, 110, 0.7);">${escapeHtml(content)}</div>`;
      chatDiv.scrollTop = chatDiv.scrollHeight;
    }
  } else {
    alert(content);
  }
};

// ===== 2. AI CHAT WITH PERSONAS (Enhanced) =====
let currentPersona = 'warm';

function initPersonaButtons() {
  document.querySelectorAll('.persona-btn').forEach((btn) => {
    btn.removeEventListener('click', personaClickHandler);
    btn.addEventListener('click', personaClickHandler);
  });
}

function personaClickHandler(e) {
  document
    .querySelectorAll('.persona-btn')
    .forEach((b) => b.classList.remove('active'));
  e.target.classList.add('active');
  currentPersona = e.target.dataset.persona;
  const chatDiv = document.getElementById('chatMessages');
  if (chatDiv) {
    chatDiv.innerHTML += `<div class="bubble-bot rounded-2xl p-3 mb-2 max-w-[85%]" style="background: rgba(20, 50, 110, 0.7);">✨ Switched to ${e.target.textContent} mode. How can I help?</div>`;
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }
}

async function sendEnhancedChatMessage() {
  const input = document.getElementById('chatInput');
  const message = input?.value.trim();
  if (!message) return;

  const chatDiv = document.getElementById('chatMessages');
  if (!chatDiv) return;

  // Add user message
  chatDiv.innerHTML += `<div class="bubble-user rounded-2xl p-3 mb-2 max-w-[85%] ml-auto" style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.8));">${escapeHtml(message)}</div>`;
  input.value = '';

  // Typing indicator
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'bubble-bot rounded-2xl p-3 mb-2 max-w-[85%]';
  typingIndicator.style.background = 'rgba(20, 50, 110, 0.7)';
  typingIndicator.innerHTML =
    '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
  chatDiv.appendChild(typingIndicator);
  chatDiv.scrollTop = chatDiv.scrollHeight;

  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        userId: getCurrentUserId(),
        persona: currentPersona,
      }),
    });
    const data = await response.json();

    // Remove typing indicator
    chatDiv.removeChild(typingIndicator);

    if (data.success && data.reply) {
      chatDiv.innerHTML += `<div class="bubble-bot rounded-2xl p-3 mb-2 max-w-[85%]" style="background: rgba(20, 50, 110, 0.7);">${escapeHtml(data.reply)}</div>`;

      // Offer to save helpful responses
      if (
        data.reply.length > 30 &&
        confirm('Was this response helpful? Save it to your toolbox?')
      ) {
        saveToToolbox(
          'AI Response',
          'ai_response',
          data.reply.substring(0, 100)
        );
      }
    } else {
      chatDiv.innerHTML += `<div class="bubble-bot rounded-2xl p-3 mb-2 max-w-[85%]" style="background: rgba(20, 50, 110, 0.7);">I'm here for you. Want to try again? 💙</div>`;
    }
    chatDiv.scrollTop = chatDiv.scrollHeight;
  } catch (error) {
    chatDiv.removeChild(typingIndicator);
    chatDiv.innerHTML += `<div class="bubble-bot rounded-2xl p-3 mb-2 max-w-[85%]" style="background: rgba(20, 50, 110, 0.7);">I'm having trouble connecting. Please try again. 💙</div>`;
    chatDiv.scrollTop = chatDiv.scrollHeight;
  }
}

// ===== 3. DIGITAL GARDEN =====
async function loadGarden() {
  try {
    const response = await fetch(
      `${BACKEND_URL}/api/garden/${getCurrentUserId()}`
    );
    const data = await response.json();

    const gardenGrid = document.getElementById('gardenGrid');
    if (gardenGrid && data.garden) {
      gardenGrid.innerHTML = data.garden
        .map(
          (plant) =>
            `<div class="text-center text-3xl p-2 rounded-xl" style="background: rgba(0,0,0,0.2);">${plant}</div>`
        )
        .join('');
    }

    const streakText = document.getElementById('streakText');
    if (streakText) {
      streakText.innerHTML =
        data.streak === 0
          ? '🌱 Start your journey - write a journal to plant your first seed!'
          : `🌸 ${data.streak} day streak - Your garden is growing! Keep showing up 💙`;
    }
  } catch (error) {
    console.error('Error loading garden:', error);
  }
}

// ===== 4. WELLNESS SUMMARY =====
function initWellnessSummary() {
  const generateBtn = document.getElementById('generateSummaryBtn');
  const exportBtn = document.getElementById('exportSummaryBtn');

  if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
      const summaryDiv = document.getElementById('summaryOutput');
      if (!summaryDiv) return;

      summaryDiv.innerHTML =
        '<div class="text-center">✨ Generating your personalized insights...</div>';

      try {
        const response = await fetch(
          `${BACKEND_URL}/api/wellness/summary/${getCurrentUserId()}`,
          { method: 'POST' }
        );
        const data = await response.json();
        summaryDiv.innerHTML =
          data.summary || '📭 Not enough entries this week. Keep journaling!';
      } catch (error) {
        summaryDiv.innerHTML =
          '⚠️ Unable to generate summary. Please try again.';
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const summary = document.getElementById('summaryOutput')?.innerText;
      if (
        summary &&
        summary !== 'Click generate to see your weekly insights' &&
        summary !== '✨ Generating your personalized insights...'
      ) {
        navigator.clipboard.writeText(summary);
        showNotificationMessage(
          '📋 Summary copied! You can paste this for your therapist.'
        );
      } else {
        alert('Please generate a summary first');
      }
    });
  }
}

// ===== 5. SOS GROUNDING EXERCISE =====
function startGrounding() {
  const steps = [
    '👀 5 things you can SEE',
    '✋ 4 things you can TOUCH',
    '👂 3 things you can HEAR',
    '👃 2 things you can SMELL',
    '👄 1 thing you can TASTE',
  ];

  let step = 0;
  const modal = document.createElement('div');
  modal.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; justify-content: center; align-items: center; z-index: 10000;';
  modal.innerHTML = `
        <div class="glass rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <h2 class="text-2xl font-bold text-aurora mb-4">🧘 Grounding Exercise</h2>
            <div class="text-3xl my-6" id="groundingStep">${steps[0]}</div>
            <input type="text" id="groundingInput" class="input-glass w-full px-4 py-2 rounded-xl mb-4" placeholder="Your answer...">
            <button id="groundingNext" class="btn-primary w-full py-2 rounded-xl">Next →</button>
            <button id="groundingClose" class="btn-glass w-full mt-3 py-2 rounded-xl">Close</button>
        </div>
    `;
  document.body.appendChild(modal);

  const stepDiv = modal.querySelector('#groundingStep');
  const input = modal.querySelector('#groundingInput');

  modal.querySelector('#groundingNext').onclick = () => {
    if (!input.value.trim()) {
      input.style.borderColor = '#ef4444';
      input.style.borderWidth = '2px';
      return;
    }
    step++;
    if (step < steps.length) {
      stepDiv.textContent = steps[step];
      input.value = '';
      input.style.borderColor = '';
    } else {
      modal.innerHTML = `
                <div class="glass rounded-2xl p-8 max-w-md w-full mx-4 text-center">
                    <div class="text-6xl mb-4">🎉</div>
                    <h2 class="text-2xl font-bold mb-2">You did it!</h2>
                    <p class="text-text-secondary mb-4">Your nervous system is now calmer.</p>
                    <button id="finalClose" class="btn-primary w-full py-2 rounded-xl">Close</button>
                </div>
            `;
      modal.querySelector('#finalClose').onclick = () => modal.remove();
    }
  };

  modal.querySelector('#groundingClose').onclick = () => modal.remove();
}

function startBreathingExercise(seconds) {
  const modal = document.createElement('div');
  modal.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.95); display: flex; justify-content: center; align-items: center; z-index: 10000;';
  modal.innerHTML = `
        <div class="glass rounded-2xl p-8 max-w-md w-full mx-4 text-center">
            <h2 class="text-2xl font-bold text-aurora mb-4">🧘 Breathing Exercise</h2>
            <div class="text-4xl my-4" id="breathText">Breathe In...</div>
            <div class="text-3xl font-bold my-4" id="breathTimer">${seconds}s</div>
            <div class="w-32 h-32 rounded-full mx-auto transition-all duration-4000" id="breathCircle" style="background: rgba(59,130,246,0.3);"></div>
            <button id="closeBreathing" class="btn-glass w-full mt-6 py-2 rounded-xl">Stop</button>
        </div>
    `;
  document.body.appendChild(modal);

  let timeLeft = seconds;
  let isInhaling = true;

  const timer = setInterval(() => {
    timeLeft--;
    const timerDiv = modal.querySelector('#breathTimer');
    if (timerDiv) timerDiv.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      clearInterval(breathInterval);
      modal.remove();
    }
  }, 1000);

  const breathInterval = setInterval(() => {
    const circle = modal.querySelector('#breathCircle');
    const text = modal.querySelector('#breathText');
    if (isInhaling) {
      if (text) text.textContent = 'Breathe In...';
      if (circle) circle.style.transform = 'scale(1.5)';
    } else {
      if (text) text.textContent = 'Breathe Out...';
      if (circle) circle.style.transform = 'scale(1)';
    }
    isInhaling = !isInhaling;
  }, 4000);

  modal.querySelector('#closeBreathing').onclick = () => {
    clearInterval(timer);
    clearInterval(breathInterval);
    modal.remove();
  };
}

// ===== INITIALIZE NEW FEATURES =====
function initNewFeatures() {
  loadToolbox();
  loadGarden();
  initWellnessSummary();
  initPersonaButtons();

  const sendBtn = document.getElementById('sendChatBtn');
  const chatInput = document.getElementById('chatInput');
  const sosBtn = document.getElementById('sosButton');
  const crisisBtn = document.getElementById('crisisGroundingBtn');
  const emergencyBtn = document.getElementById('emergencyCalmBtn');

  if (sendBtn) {
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    newSendBtn.addEventListener('click', sendEnhancedChatMessage);
  }
  if (chatInput) {
    chatInput.removeEventListener('keypress', submitChat);
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendEnhancedChatMessage();
    });
  }
  if (sosBtn) sosBtn.addEventListener('click', startGrounding);
  if (crisisBtn) crisisBtn.addEventListener('click', startGrounding);
  if (emergencyBtn)
    emergencyBtn.addEventListener('click', () => startBreathingExercise(60));
}

// ===== RENDER =====
function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (currentUser && ['login', 'signup', 'landing'].includes(currentPage))
    currentPage = 'dashboard';
  if (!currentUser && ['dashboard', 'chatbot', 'profile'].includes(currentPage))
    currentPage = 'landing';

  switch (currentPage) {
    case 'landing':
      app.innerHTML = LandingPage();
      break;
    case 'about':
      app.innerHTML = AboutPage();
      break;
    case 'login':
      app.innerHTML = LoginPage();
      break;
    case 'signup':
      app.innerHTML = SignupPage();
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
      app.innerHTML = ChatbotPage();
      setTimeout(renderChatMessages, 50);
      setTimeout(initNewFeatures, 100);
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
    default:
      app.innerHTML = LandingPage();
  }

  renderGoogleButtons();

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

// Expose functions to global scope
window.goto = goto;
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
window.activateToolboxItem = window.activateToolboxItem;
