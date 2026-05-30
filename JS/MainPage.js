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
import { Nav } from './pages/Nav.js';
import {
  renderGamesHub, startGame, completeGame, exitGame,
  getRecommendedGames, initGamesHub, flipMemoryCard,
  puzzleTileClick, shufflePuzzle, checkPuzzleComplete,
  handlePuzzleCanvasClick, drawPuzzleCanvas, selectColor,
  colorSection, completeColoringGame, focusButtonPress,
  startFocusRound, selectTriviaAnswer, getGameState,
  getRandomMotivationalMessage,
} from './games-hub.js';

// ─────────────────────────────────────────────
//  EMAILJS / OTP CONFIG
// ─────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY  = 'a57sbhuvr2E32KeUo';
const EMAILJS_SERVICE_ID  = 'service_7kyajxl';
const EMAILJS_TEMPLATE_ID = 'template_3zl7kul';

// In-memory OTP store  { email -> { code, expiresAt, attempts } }
const otpStore = {};
const OTP_TTL_MS    = 5 * 60 * 1000; // 5 minutes
const OTP_MAX_TRIES = 5;

// Countdown interval refs so we can clear them when navigating away
let loginTimerInterval  = null;
let signupTimerInterval = null;
let resetTimerInterval  = null;

// Temp storage for credentials while we wait for OTP confirmation
let pendingLoginCredentials  = null; // { email, password }
let pendingSignupCredentials = null; // { name, email, password }
let pendingResetEmail        = null; // string

/** Lazy-load EmailJS SDK — resolves only after SDK is fully ready */
let _emailjsReady = false;
function ensureEmailJS() {
  return new Promise((resolve, reject) => {
    // Already initialised
    if (_emailjsReady && window.emailjs) { resolve(); return; }
    // SDK loaded but not yet initialised
    if (window.emailjs && !_emailjsReady) {
      try { emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); _emailjsReady = true; resolve(); } catch(e) { reject(e); }
      return;
    }
    // Need to load the script
    const existing = document.querySelector('script[src*="emailjs"]');
    if (existing) {
      // Script tag exists but may still be loading — poll
      const poll = setInterval(() => {
        if (window.emailjs) {
          clearInterval(poll);
          try { emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); _emailjsReady = true; resolve(); } catch(e) { reject(e); }
        }
      }, 100);
      setTimeout(() => { clearInterval(poll); reject(new Error('EmailJS SDK timeout')); }, 10000);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = () => {
      try { emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY }); _emailjsReady = true; resolve(); }
      catch(e) { reject(e); }
    };
    s.onerror = () => reject(new Error('EmailJS SDK failed to load — check internet connection'));
    document.head.appendChild(s);
  });
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, name = '') {
  try {
    await ensureEmailJS();

    const code = generateOTP();
    otpStore[email.toLowerCase()] = {
      code,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    };

    console.log('[OTP] Sending to:', email, '| Service:', EMAILJS_SERVICE_ID, '| Template:', EMAILJS_TEMPLATE_ID);

    // Match your EmailJS template variables exactly: {{email}}, {{passcode}}, {{time}}
    const expiryTime = new Date(Date.now() + OTP_TTL_MS).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      email:    email,
      passcode: code,
      time:     expiryTime,
    });

    console.log('[OTP] EmailJS response:', response);
    return { success: true };

  } catch (err) {
    // Log the full error so we can diagnose in DevTools
    console.error('[OTP] sendOTPEmail failed — full error object:', err);
    console.error('[OTP] status:', err?.status, '| text:', err?.text, '| message:', err?.message);

    // Produce a specific, helpful message based on the EmailJS error code
    let msg = 'Failed to send OTP. ';
    if (!window.emailjs) {
      msg += 'EmailJS SDK did not load — check your internet connection.';
    } else if (err?.status === 400) {
      msg += 'Template variable mismatch — make sure your EmailJS template uses {{email}}, {{passcode}}, and {{time}}.';
    } else if (err?.status === 401 || err?.status === 403) {
      msg += 'Invalid EmailJS Public Key or Service ID — check your credentials.';
    } else if (err?.status === 404) {
      msg += 'EmailJS Service ID or Template ID not found — verify them in your EmailJS dashboard.';
    } else if (err?.status === 429) {
      msg += 'Too many requests — please wait a minute and try again.';
    } else if (err?.text) {
      msg += err.text;
    } else if (err?.message) {
      msg += err.message;
    } else {
      msg += 'Unknown error — open DevTools (F12) → Console for details.';
    }

    return { success: false, message: msg };
  }
}

function verifyOTPCode(email, input) {
  const key    = email.toLowerCase();
  const record = otpStore[key];
  if (!record)                          return { success: false, message: 'No OTP found. Please request a new one.' };
  if (Date.now() > record.expiresAt)  { delete otpStore[key]; return { success: false, message: 'OTP expired. Please request a new one.' }; }
  if (record.attempts >= OTP_MAX_TRIES){ delete otpStore[key]; return { success: false, message: 'Too many attempts. Please request a new OTP.' }; }
  record.attempts++;
  if (input.trim() !== record.code) {
    const left = OTP_MAX_TRIES - record.attempts;
    return { success: false, message: `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.` };
  }
  delete otpStore[key];
  return { success: true };
}

/** Start a countdown on a <span> element, calling onExpire when done */
function startOTPCountdown(spanId, onExpire) {
  let seconds = 300;
  const el = document.getElementById(spanId);
  const tick = () => {
    if (!document.getElementById(spanId)) return; // navigated away
    seconds--;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (el) el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    if (seconds <= 0 && onExpire) onExpire();
  };
  return setInterval(tick, 1000);
}

/** Read the six OTP boxes and return the combined string */
function readOTPBoxes(prefix) {
  return [0,1,2,3,4,5].map(i => {
    const el = document.getElementById(`${prefix}${i}`);
    return el ? el.value : '';
  }).join('');
}

// ─────────────────────────────────────────────
//  OTP INPUT UX HELPERS  (exposed to window)
// ─────────────────────────────────────────────
window.otpInputMove = function(input, index, prefix) {
  input.value = input.value.replace(/\D/g, '').slice(-1);
  if (input.value && index < 5) {
    const next = document.getElementById(`${prefix}${index + 1}`);
    if (next) next.focus();
  }
};

window.otpInputBack = function(e, index, prefix) {
  if (e.key === 'Backspace' && !e.target.value && index > 0) {
    const prev = document.getElementById(`${prefix}${index - 1}`);
    if (prev) { prev.value = ''; prev.focus(); }
  }
  if (e.key === 'Enter') {
    // Trigger verify for the right flow
    if (prefix === 'loginOtp')  window.handleLoginVerifyOTP?.();
    if (prefix === 'signupOtp') window.handleSignupVerifyOTP?.();
    if (prefix === 'resetOtp')  window.handleResetVerifyOTP?.();
  }
};

window.otpPaste = function(e, prefix) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '').slice(0, 6);
  text.split('').forEach((char, i) => {
    const box = document.getElementById(`${prefix}${i}`);
    if (box) box.value = char;
  });
  const last = document.getElementById(`${prefix}${Math.min(text.length, 5)}`);
  if (last) last.focus();
};

// ─────────────────────────────────────────────
//  BACKEND URL
// ─────────────────────────────────────────────
const BACKEND_URL = (() => {
  const origin = window.location.origin;
  if (origin.includes(':3001')) return origin;
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) return 'http://localhost:3001';
  return origin;
})();

async function parseJsonResponse(response) {
  const raw = await response.text();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { throw new Error(`Invalid JSON: ${raw.substr(0, 300)}`); }
}

async function fetchUserMoodEntries(userId) {
  const r = await fetch(`${BACKEND_URL}/mood-entries?userId=${encodeURIComponent(userId)}`);
  const d = await parseJsonResponse(r);
  if (!r.ok) throw new Error(d?.error || 'Could not load mood entries');
  return d.entries || [];
}

async function addMoodEntry(userId, mood, moodLabel, feeling) {
  const r = await fetch(`${BACKEND_URL}/mood-entry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, mood, moodLabel, feeling }),
  });
  const d = await parseJsonResponse(r);
  if (!r.ok) throw new Error(d?.error || 'Could not save mood entry');
  return d;
}

// ─────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────
let currentUser = null, currentPage = 'landing';
let moodHistory = [], chatMessages = [];
let selectedMood = null, moodChart = null;
let selectedArticle = null, openFaq = null;

const CRISIS = [
  { title: 'SADAG Suicide & Crisis Lifeline', desc: 'Available 24/7 for anyone in emotional distress or suicidal crisis.', action: 'Call 0800567567', icon: '📞', color: 'rgba(248,113,113,0.18)', border: '#fca5a5' },
  { title: 'Crisis Text Line', desc: 'Support via text message. Text HOME to 741741 for free, confidential help.', action: 'Text 741741', icon: '💬', color: 'rgba(167,139,250,0.18)', border: '#c4b5fd' },
  { title: 'Immediate Support', desc: 'If you are in immediate danger, contact: 0660340946 / 0732848953 or email cebolakhemabo05@gmail.com / ayabongafatane@gmail.com.', action: 'Contact Support', icon: '🚨', color: 'rgba(249,115,22,0.12)', border: '#fb923c' },
];

const ARTICLES = [
  { tag: 'Self-care', readTime: '5 min read', title: 'How to Build a Simple Daily Routine', desc: 'A calm routine can help you feel more grounded and less overwhelmed.', content: 'A simple daily routine can ease anxiety and create structure. Start with small habits like morning stretches, a hydration break, and a five-minute mindfulness check-in. Over time, refine your routine so it feels supportive rather than strict.' },
  { tag: 'Mindset', readTime: '6 min read', title: 'Recognizing and Managing Stress Triggers', desc: 'Learn to spot the things that raise your stress and make small changes.', content: 'Stress triggers are personal. They can be deadlines, social pressure, or big life changes. Notice what feelings come up, then give yourself permission to pause, breathe, and choose a small action that helps you feel safer.' },
  { tag: 'Sleep', readTime: '4 min read', title: 'Better Sleep Habits for a Calmer Mind', desc: 'Small evening habits can lead to better rest and improved emotional balance.', content: 'Good sleep begins before bed. Dim the lights, limit screen time, and choose a relaxing activity like reading or stretching. When you wake, keep mornings gentle so your body and mind can start the day calmly.' },
  { tag: 'Emotions', readTime: '5 min read', title: 'Simple Ways to Name and Release Feelings', desc: 'Naming emotions is the first step to processing them in a healthy way.', content: 'When you feel intense emotions, pause and label them: sadness, worry, anger, relief. Writing or speaking them aloud helps your brain feel less stuck. Then try a gentle activity that supports the feeling, like taking a walk or drawing.' },
  { tag: 'Self-care', readTime: '8 min read', title: 'Self-care, Emotions, Mindset & Sleep Tips', desc: 'Practical daily habits for calm, resilience, and better rest.', content: '🌱 Self-care\nDigital detox: Schedule one hour daily without screens. Body nourishment: Hydrate intentionally.\n\n💖 Emotions\nGratitude journaling: Write three things you\'re grateful for each evening.\n\n🧠 Mindset\nGrowth mindset: Replace "I can\'t do this" with "I can\'t do this yet."\n\n😴 Sleep\nConsistent schedule: Go to bed and wake up at the same time daily.' },
];

const FAQS = [
  { q: 'What should I do if I feel overwhelmed?', a: 'If you feel overwhelmed, try deep breaths, reach out to someone you trust, and use a grounding technique. If you are in danger, contact emergency services immediately.' },
  { q: 'Can I use this app privately?', a: 'Yes. Your mood entries and chats are stored securely and are not shared unless you choose to share them.' },
  { q: 'Where can I find extra help?', a: 'Use the Crisis Resources section for immediate hotlines and trusted support services. You can also contact a mental health professional when you feel ready.' },
];

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

// ─────────────────────────────────────────────
//  AUTH CORE  (actual login/register calls)
// ─────────────────────────────────────────────
async function login(email, password) {
  const response = await fetch(`${BACKEND_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.error || 'Login failed');
  currentUser = data.user;
  localStorage.setItem('ms_user', JSON.stringify(currentUser));
  try {
    const entries = await fetchUserMoodEntries(currentUser.id);
    moodHistory = entries.map(e => ({ date: e.date, mood: e.mood, feeling: e.feeling, timestamp: Date.now() }));
  } catch { moodHistory = []; }
  load();
  goto('dashboard');
}

async function signup(name, email, password) {
  const response = await fetch(`${BACKEND_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.error || 'Registration failed');
  await login(email, password);
}

// ─────────────────────────────────────────────
//  LOGIN WITH OTP  (2FA flow)
// ─────────────────────────────────────────────
window.handleLoginRequestOTP = async function() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const pw    = document.getElementById('loginPassword')?.value;
  const err   = document.getElementById('loginError');
  if (!email || !pw) { showError(err, 'Please fill in all fields.'); return; }

  // First verify credentials are valid before sending OTP
  try {
    const response = await fetch(`${BACKEND_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pw }),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) { showError(err, data?.error || 'Incorrect email or password.'); return; }
  } catch {
    showError(err, 'Could not reach server. Please try again.');
    return;
  }

  // Credentials valid — send OTP
  const btn = document.getElementById('loginOtpBtn') || document.querySelector('#loginFormStep .btn-primary');
  if (btn) { btn.textContent = 'Sending code…'; btn.disabled = true; }

  const result = await sendOTPEmail(email, email.split('@')[0]);

  if (btn) { btn.textContent = 'Sign in'; btn.disabled = false; }

  if (!result.success) { showError(err, result.message); return; }

  pendingLoginCredentials = { email, password: pw };

  // Show OTP step
  document.getElementById('loginFormStep').style.display = 'none';
  document.getElementById('loginOtpStep').style.display  = 'block';
  const display = document.getElementById('loginOtpEmailDisplay');
  if (display) display.textContent = email;

  clearInterval(loginTimerInterval);
  loginTimerInterval = startOTPCountdown('loginOtpTimer', () => {
    showError(document.getElementById('loginOtpError'), 'OTP expired. Please go back and request a new one.');
  });

  setTimeout(() => document.getElementById('loginOtp0')?.focus(), 100);
};

window.handleLoginVerifyOTP = async function() {
  const code = readOTPBoxes('loginOtp');
  const err  = document.getElementById('loginOtpError');
  if (code.length < 6) { showError(err, 'Please enter the full 6-digit code.'); return; }

  const result = verifyOTPCode(pendingLoginCredentials.email, code);
  if (!result.success) { showError(err, result.message); return; }

  clearInterval(loginTimerInterval);
  showToast('Verified! Signing you in…', 'success');

  try {
    await login(pendingLoginCredentials.email, pendingLoginCredentials.password);
    pendingLoginCredentials = null;
  } catch (e) {
    showError(err, e.message || 'Login failed after OTP. Please try again.');
  }
};

window.handleLoginResendOTP = async function() {
  if (!pendingLoginCredentials) return;
  const btn = document.getElementById('loginResendBtn');
  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
  const result = await sendOTPEmail(pendingLoginCredentials.email);
  if (btn) { btn.textContent = 'Resend code'; btn.disabled = false; }
  if (result.success) {
    showToast('New code sent!', 'success');
    clearInterval(loginTimerInterval);
    loginTimerInterval = startOTPCountdown('loginOtpTimer', () => {
      showError(document.getElementById('loginOtpError'), 'OTP expired. Please go back and try again.');
    });
  } else {
    showError(document.getElementById('loginOtpError'), result.message);
  }
};

window.backToLoginForm = function() {
  clearInterval(loginTimerInterval);
  pendingLoginCredentials = null;
  document.getElementById('loginOtpStep').style.display  = 'none';
  document.getElementById('loginFormStep').style.display = 'block';
};

// ─────────────────────────────────────────────
//  SIGNUP WITH OTP
// ─────────────────────────────────────────────
window.handleSignupRequestOTP = async function() {
  const name  = document.getElementById('signupName')?.value?.trim();
  const email = document.getElementById('signupEmail')?.value?.trim();
  const pw    = document.getElementById('signupPassword')?.value;
  const err   = document.getElementById('signupError');

  if (!name || !email || !pw) { showError(err, 'Please fill in all fields.'); return; }
  if (!isPasswordStrong(pw))  { showError(err, 'Password must be at least 8 characters and include one number and one special character.'); return; }

  const btn = document.getElementById('signupOtpBtn');
  if (btn) { btn.textContent = 'Sending code…'; btn.disabled = true; }

  const result = await sendOTPEmail(email, name);

  if (btn) { btn.textContent = 'Send Verification Code'; btn.disabled = false; }

  if (!result.success) { showError(err, result.message); return; }

  pendingSignupCredentials = { name, email, password: pw };

  document.getElementById('signupFormStep').style.display = 'none';
  document.getElementById('signupOtpStep').style.display  = 'block';
  const display = document.getElementById('signupOtpEmailDisplay');
  if (display) display.textContent = email;

  clearInterval(signupTimerInterval);
  signupTimerInterval = startOTPCountdown('signupOtpTimer', () => {
    showError(document.getElementById('signupOtpError'), 'OTP expired. Please go back and request a new one.');
  });

  setTimeout(() => document.getElementById('signupOtp0')?.focus(), 100);
};

window.handleSignupVerifyOTP = async function() {
  const code = readOTPBoxes('signupOtp');
  const err  = document.getElementById('signupOtpError');
  if (code.length < 6) { showError(err, 'Please enter the full 6-digit code.'); return; }

  const result = verifyOTPCode(pendingSignupCredentials.email, code);
  if (!result.success) { showError(err, result.message); return; }

  clearInterval(signupTimerInterval);
  showToast('Email verified! Creating your account…', 'success');

  try {
    await signup(pendingSignupCredentials.name, pendingSignupCredentials.email, pendingSignupCredentials.password);
    pendingSignupCredentials = null;
  } catch (e) {
    showError(err, e.message || 'Account creation failed. Please try again.');
  }
};

window.handleSignupResendOTP = async function() {
  if (!pendingSignupCredentials) return;
  const btn = document.getElementById('signupResendBtn');
  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
  const result = await sendOTPEmail(pendingSignupCredentials.email, pendingSignupCredentials.name);
  if (btn) { btn.textContent = 'Resend code'; btn.disabled = false; }
  if (result.success) {
    showToast('New code sent!', 'success');
    clearInterval(signupTimerInterval);
    signupTimerInterval = startOTPCountdown('signupOtpTimer', () => {
      showError(document.getElementById('signupOtpError'), 'OTP expired. Please go back and try again.');
    });
  } else {
    showError(document.getElementById('signupOtpError'), result.message);
  }
};

window.backToSignupForm = function() {
  clearInterval(signupTimerInterval);
  pendingSignupCredentials = null;
  document.getElementById('signupOtpStep').style.display  = 'none';
  document.getElementById('signupFormStep').style.display = 'block';
};

// ─────────────────────────────────────────────
//  PASSWORD RESET WITH OTP  (3 steps)
// ─────────────────────────────────────────────
window.handleResetRequestOTP = async function() {
  const email = document.getElementById('resetEmail')?.value?.trim();
  const err   = document.getElementById('resetEmailError');
  if (!email) { showError(err, 'Please enter your email address.'); return; }

  const btn = document.querySelector('#resetEmailStep .btn-primary');
  if (btn) { btn.textContent = 'Sending code…'; btn.disabled = true; }

  const result = await sendOTPEmail(email);

  if (btn) { btn.textContent = 'Send Verification Code'; btn.disabled = false; }

  if (!result.success) { showError(err, result.message); return; }

  pendingResetEmail = email;

  document.getElementById('resetEmailStep').style.display    = 'none';
  document.getElementById('resetOtpStep').style.display      = 'block';
  const display = document.getElementById('resetOtpEmailDisplay');
  if (display) display.textContent = email;

  clearInterval(resetTimerInterval);
  resetTimerInterval = startOTPCountdown('resetOtpTimer', () => {
    showError(document.getElementById('resetOtpError'), 'OTP expired. Please go back and request a new one.');
  });

  setTimeout(() => document.getElementById('resetOtp0')?.focus(), 100);
};

window.handleResetVerifyOTP = function() {
  const code = readOTPBoxes('resetOtp');
  const err  = document.getElementById('resetOtpError');
  if (code.length < 6) { showError(err, 'Please enter the full 6-digit code.'); return; }

  const result = verifyOTPCode(pendingResetEmail, code);
  if (!result.success) { showError(err, result.message); return; }

  clearInterval(resetTimerInterval);
  showToast('Identity verified! Set your new password.', 'success');

  document.getElementById('resetOtpStep').style.display      = 'none';
  document.getElementById('resetPasswordStep').style.display = 'block';
  setTimeout(() => document.getElementById('resetNewPassword')?.focus(), 100);
};

window.handleResetResendOTP = async function() {
  if (!pendingResetEmail) return;
  const btn = document.getElementById('resetResendBtn');
  if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }
  const result = await sendOTPEmail(pendingResetEmail);
  if (btn) { btn.textContent = 'Resend code'; btn.disabled = false; }
  if (result.success) {
    showToast('New code sent!', 'success');
    clearInterval(resetTimerInterval);
    resetTimerInterval = startOTPCountdown('resetOtpTimer', () => {
      showError(document.getElementById('resetOtpError'), 'OTP expired. Please go back and try again.');
    });
  } else {
    showError(document.getElementById('resetOtpError'), result.message);
  }
};

window.backToResetEmail = function() {
  clearInterval(resetTimerInterval);
  pendingResetEmail = null;
  document.getElementById('resetOtpStep').style.display   = 'none';
  document.getElementById('resetEmailStep').style.display = 'block';
};

// ─────────────────────────────────────────────
//  GOOGLE OAUTH
// ─────────────────────────────────────────────
async function handleGoogleCredentialResponse(response) {
  if (!response?.credential) {
    showError(document.getElementById('loginError') || document.getElementById('signupError'), 'Google sign-in failed. Please try again.');
    return;
  }
  try {
    const res  = await fetch(`${BACKEND_URL}/oauth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: response.credential }) });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data?.error || 'Google login failed');
    currentUser = data.user;
    localStorage.setItem('ms_user', JSON.stringify(currentUser));
    try {
      const entries = await fetchUserMoodEntries(currentUser.id);
      moodHistory = entries.map(e => ({ date: e.date, mood: e.mood, feeling: e.feeling, timestamp: Date.now() }));
    } catch { moodHistory = []; }
    load();
    goto('dashboard');
  } catch (error) {
    console.error('Google login error:', error);
    showError(document.getElementById('loginError') || document.getElementById('signupError'), error.message || 'Google sign-in failed.');
  }
}

function isPasswordStrong(password) {
  return typeof password === 'string' && password.length >= 8 && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

function logout() {
  currentUser = null;
  localStorage.removeItem('ms_user');
  moodHistory = [];
  chatMessages = [];
  goto('landing');
}

function goto(page) {
  // Clear any running OTP timers when navigating away
  clearInterval(loginTimerInterval);
  clearInterval(signupTimerInterval);
  clearInterval(resetTimerInterval);
  currentPage = page;
  render();
  window.scrollTo(0, 0);
}

const moodOptions = [
  { value: 1, label: 'Very Low', emoji: '😢', color: '#ef4444' },
  { value: 2, label: 'Low',      emoji: '😔', color: '#f97316' },
  { value: 3, label: 'Neutral',  emoji: '😐', color: '#eab308' },
  { value: 4, label: 'Good',     emoji: '😊', color: '#22c55e' },
  { value: 5, label: 'Great',    emoji: '😄', color: '#38bdf8' },
];
const moodLabels = { 1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Great' };

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
  if (i.includes('sad') || i.includes('depressed') || i.includes('down') || i.includes('cry') || i.includes('hopeless'))
    return "I'm truly sorry you're feeling this way. Those emotions are heavy to carry. You're not alone in this — I'm here. Would you like to track this on your dashboard so we can watch for patterns together?";
  if (i.includes('happy') || i.includes('great') || i.includes('amazing') || i.includes('good'))
    return "That genuinely makes me happy to hear 🌿 These positive moments deserve to be remembered. What's been bringing the light in lately?";
  if (i.includes('anxious') || i.includes('anxiety') || i.includes('panic') || i.includes('worry') || i.includes('stress'))
    return "Anxiety can feel like a wave that won't stop. Try this: breathe in for 4 counts, hold for 7, breathe out for 8. Do that twice. Would you like to talk about what's been triggering this?";
  if (i.includes('sleep') || i.includes('tired') || i.includes('exhaust') || i.includes('rest'))
    return "Sleep and emotional wellbeing are deeply linked. When we're depleted, everything feels harder. Are you getting enough rest, and if not — what do you think is getting in the way?";
  if (i.includes('help') || i.includes('support') || i.includes('crisis') || i.includes('download') || i.includes('app'))
    return "I'm right here with you. If you want extra guided support, you have three great options: HelloBetter at https://hellobetter.de/en/ello/ , AuraMind at https://play.google.com/store/apps/details?id=com.zoony.auramind , or Nuom Health at https://www.nuom.health/your-business/healthcare-software/digital-solutions-for-mental-health .";
  if (i.includes('mood') || i.includes('track'))
    return moodHistory.length
      ? `Your last recorded mood was ${moodLabels[moodHistory[moodHistory.length - 1].mood].toLowerCase()} on ${moodHistory[moodHistory.length - 1].date}. How are you feeling compared to then?`
      : 'Head to the Dashboard to start tracking — even a few entries reveal really meaningful patterns about your emotional world.';
  return botReplies[Math.floor(Math.random() * botReplies.length)];
}

function escHtml(t) { return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function linkifyText(t) { return escHtml(t).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noreferrer" style="color:#60a5fa;text-decoration:underline;">$1</a>'); }
function fmtTime(ts) { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }

function updateProgressBar(inputId) {
  const input = document.getElementById(inputId);
  const bar   = document.getElementById(inputId + 'Progress');
  if (!input || !bar) return;
  const v = input.value;
  let progress = 0, colorClass = 'progress-red';
  if (input.type === 'email') {
    if (v.length > 0) progress = 33;
    if (v.includes('@')) progress = 66;
    if (v.includes('@') && v.includes('.') && v.length > 5) progress = 100;
  } else if (input.type === 'password') {
    if (v.length > 0) progress = 20;
    if (v.length >= 4) progress = 40;
    if (v.length >= 8) progress = 60;
    if (v.length >= 8 && /\d/.test(v)) progress = 80;
    if (v.length >= 8 && /\d/.test(v) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v)) progress = 100;
  }
  colorClass = progress >= 100 ? 'progress-green' : progress >= 50 ? 'progress-orange' : 'progress-red';
  bar.style.width = progress + '%';
  bar.className = 'progress-bar ' + colorClass;
}

function renderChatMessages() {
  const el = document.getElementById('chatList');
  if (!el) return;
  el.innerHTML = chatMessages.map(m =>
    m.sender === 'user'
      ? `<div class="flex gap-3 items-end justify-end anim-fadeUp">
          <div class="bubble-user rounded-2xl rounded-br-none px-4 py-3 max-w-xs backdrop-blur-md">
            <p class="text-white text-sm leading-relaxed">${escHtml(m.text)}</p>
            <p style="color:rgba(186,230,253,0.5);font-size:11px;margin-top:4px;">${fmtTime(m.timestamp)}</p>
          </div>
          <div class="w-8 h-8 rounded-full profile-avatar flex items-center justify-center text-white text-xs font-semibold flex-shrink-0" style="font-family:'Sora',sans-serif;">${currentUser?.name?.charAt(0).toUpperCase() || 'U'}</div>
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
  ).join('');
  el.scrollTop = el.scrollHeight;
}

async function sendChat(text) {
  if (!text.trim()) return;
  chatMessages.push({ id: Date.now().toString(), text, sender: 'user', timestamp: Date.now() });
  save();
  renderChatMessages();
  const chatList = document.getElementById('chatList');
  if (chatList) {
    const typing = document.createElement('div');
    typing.id = 'typingIndicator';
    typing.className = 'flex gap-3 items-end';
    typing.innerHTML = `<div class="w-8 h-8 rounded-full flex items-center justify-center" style="background:linear-gradient(135deg,#3b82f6,#2563eb);"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><div class="bubble-bot rounded-2xl rounded-bl-none px-4 py-3"><div class="typing-dots"><span></span><span></span><span></span></div></div>`;
    chatList.appendChild(typing);
    chatList.scrollTop = chatList.scrollHeight;
  }
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, userId: currentUser?.id }) });
    const data = await response.json();
    document.getElementById('typingIndicator')?.remove();
    chatMessages.push({ id: (Date.now() + 1).toString(), text: data.reply || botResponse(text), sender: 'bot', timestamp: Date.now() });
  } catch {
    document.getElementById('typingIndicator')?.remove();
    chatMessages.push({ id: (Date.now() + 1).toString(), text: botResponse(text), sender: 'bot', timestamp: Date.now() });
  }
  save();
  renderChatMessages();
}

function selectMoodBtn(val) {
  selectedMood = val;
  document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`.mood-btn[data-mood="${val}"]`)?.classList.add('selected');
  const btn = document.getElementById('submitMoodBtn');
  if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
}

async function submitMood() {
  if (!selectedMood || !currentUser) return;
  const feeling = document.getElementById('moodFeeling')?.value || '';
  try {
    await addMoodEntry(currentUser.id, selectedMood, moodLabels[selectedMood], feeling);
    moodHistory.unshift({ date: new Date().toLocaleDateString(), mood: selectedMood, feeling, timestamp: Date.now() });
    save();
    selectedMood = null;
    showToast('Mood recorded successfully!', 'success');
    goto('dashboard');
  } catch {
    showToast('Failed to save mood. Please try again.', 'error');
  }
}

function getGamesHubLoadingHtml() {
  return `<div class="loading-overlay"><div style="text-align:center;"><div class="spinner"></div><p class="loading-text">Loading games… please wait.</p></div></div>`;
}
function showGamesHubLoading() {
  const r = document.getElementById('gamesHubRoot');
  if (r) r.innerHTML = getGamesHubLoadingHtml();
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
      datasets: [{ label: 'Mood', data: last7.map(e => e.mood), borderColor: '#60a5fa', backgroundColor: ctx => { const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220); g.addColorStop(0, 'rgba(56,189,248,0.25)'); g.addColorStop(1, 'rgba(56,189,248,0.01)'); return g; }, borderWidth: 2.5, pointBackgroundColor: '#60a5fa', pointBorderColor: 'rgba(3,13,23,0.8)', pointBorderWidth: 2, pointRadius: 5, tension: 0.45, fill: true }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 1, max: 5, ticks: { color: 'rgba(147,210,244,0.6)', callback: v => moodLabels[v] || '', font: { size: 11, family: 'DM Sans' } }, grid: { color: 'rgba(56,189,248,0.06)' } },
        x: { ticks: { color: 'rgba(147,210,244,0.6)', maxRotation: 0, font: { size: 11, family: 'DM Sans' } }, grid: { color: 'rgba(56,189,248,0.04)' } },
      },
    },
  });
}

function showError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}

function ensureToastContainer() {
  let c = document.getElementById('toastContainer');
  if (!c) { c = document.createElement('div'); c.id = 'toastContainer'; c.className = 'toast-container'; document.body.appendChild(c); }
  return c;
}

function showToast(message, type = 'success') {
  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(-12px)'; }, 3200);
  setTimeout(() => toast.remove(), 3800);
}

// Legacy handlers kept for backward compatibility
async function handleLogin() {
  const email = document.getElementById('loginEmail')?.value?.trim();
  const pw    = document.getElementById('loginPassword')?.value;
  const err   = document.getElementById('loginError');
  if (!email || !pw) { showError(err, 'Please fill in all fields.'); return; }
  window.handleLoginRequestOTP();
}

async function handleSignup() {
  window.handleSignupRequestOTP();
}

function handleResetPassword() {
  const newPw     = document.getElementById('resetNewPassword')?.value;
  const confirmPw = document.getElementById('resetConfirmPassword')?.value;
  const err       = document.getElementById('resetError');
  if (!newPw || !confirmPw) { showError(err, 'Please complete all fields.'); return; }
  if (newPw !== confirmPw)  { showError(err, 'Passwords do not match.'); return; }
  if (!isPasswordStrong(newPw)) { showError(err, 'Password must be at least 8 characters and include one number and one special character.'); return; }

  const users = JSON.parse(localStorage.getItem('ms_users') || '[]');
  const user  = users.find(u => u.email === pendingResetEmail);
  if (!user) { showError(err, 'No account found. Please try again.'); return; }
  if (user.password === newPw) { showError(err, 'Please choose a new password, not your old one.'); return; }

  user.password = newPw;
  localStorage.setItem('ms_users', JSON.stringify(users));
  pendingResetEmail = null;
  showToast('Password reset successfully! Please sign in.', 'success');
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
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function subscribeNewsletter() {
  const email = document.getElementById('newsletterEmail')?.value?.trim();
  const msg   = document.getElementById('newsletterMessage');
  if (!email) { msg.textContent = 'Please enter your email address.'; msg.style.backgroundColor = 'rgba(239,68,68,0.1)'; msg.style.color = '#f87171'; msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 4000); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Please enter a valid email address.'; msg.style.backgroundColor = 'rgba(239,68,68,0.1)'; msg.style.color = '#f87171'; msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 4000); return; }
  let s = JSON.parse(localStorage.getItem('ms_newsletter') || '[]');
  if (!s.includes(email)) { s.push(email); localStorage.setItem('ms_newsletter', JSON.stringify(s)); }
  msg.textContent = '✓ Thank you for subscribing!'; msg.style.backgroundColor = 'rgba(34,197,94,0.1)'; msg.style.color = '#22c55e'; msg.style.display = 'block';
  document.getElementById('newsletterEmail').value = '';
  setTimeout(() => msg.style.display = 'none', 4000);
}

function initNewFeatures() {
  if (currentUser && currentPage === 'dashboard') console.log('Dashboard initialized for:', currentUser.name);
}

// ─────────────────────────────────────────────
//  RENDER
// ─────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  if (!app) return;
  if (currentUser && ['login', 'signup', 'landing'].includes(currentPage)) currentPage = 'dashboard';
  if (!currentUser && ['dashboard', 'chatbot', 'profile', 'games'].includes(currentPage)) currentPage = 'landing';

  switch (currentPage) {
    case 'landing':   app.innerHTML = LandingPage(); setTimeout(() => window.google?.accounts?.id && renderGoogleButtons(), 100); break;
    case 'about':     app.innerHTML = AboutPage();   break;
    case 'login':     app.innerHTML = LoginPage();   setTimeout(() => renderGoogleButtons(), 50); break;
    case 'signup':    app.innerHTML = SignupPage();  setTimeout(() => renderGoogleButtons(), 50); break;
    case 'reset':     app.innerHTML = ResetPasswordPage(); break;
    case 'dashboard': app.innerHTML = DashboardPage({ currentUser, moodHistory, moodOptions }); setTimeout(buildChart, 80); setTimeout(initNewFeatures, 100); break;
    case 'chatbot':   app.innerHTML = ChatbotPage(currentUser); setTimeout(renderChatMessages, 50); break;
    case 'profile':   app.innerHTML = ProfilePage({ currentUser, moodHistory, moodOptions, chatMessages }); break;
    case 'privacy':   app.innerHTML = PrivacyPage(); break;
    case 'terms':     app.innerHTML = TermsPage();   break;
    case 'support':   app.innerHTML = SupportPage(); break;
    case 'resources': app.innerHTML = ResourcesPage(); setTimeout(renderFAQs, 100); break;
    case 'games':
      app.innerHTML = GamesHubPage(currentUser);
      setTimeout(() => {
        const r = document.getElementById('gamesHubRoot');
        if (r) r.innerHTML = getGamesHubLoadingHtml();
        setTimeout(() => {
          if (typeof initGamesHub === 'function') initGamesHub(currentUser);
          const rr = document.getElementById('gamesHubRoot');
          if (rr && typeof renderGamesHub === 'function') rr.innerHTML = renderGamesHub();
          setupGamesHubEventListeners();
        }, 200);
      }, 50);
      break;
    default: app.innerHTML = LandingPage();
  }

  const submitBtn = document.getElementById('submitMoodBtn');
  if (submitBtn && selectedMood) {
    submitBtn.disabled = false; submitBtn.style.opacity = '1';
    document.querySelector(`.mood-btn[data-mood="${selectedMood}"]`)?.classList.add('selected');
  }
}

// ─────────────────────────────────────────────
//  RESOURCES PAGE
// ─────────────────────────────────────────────
function ResourcesPage() {
  return `${Nav('resources', currentUser)}
  <div style="padding-top:90px;padding:24px;max-width:1100px;margin:0 auto;">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;">
      <button onclick="goto('dashboard')" style="background:none;border:none;color:var(--text-muted);font-size:14px;cursor:pointer;">← Back to Dashboard</button>
      <div>
        <h1 style="font-family:'Sora',sans-serif;font-size:32px;font-weight:700;">Resources & Support</h1>
        <p style="color:var(--text-secondary);">You're not alone. Help is always available.</p>
      </div>
    </div>
    <section style="margin-bottom:60px;">
      <h2 style="font-size:20px;font-weight:600;margin-bottom:20px;display:flex;align-items:center;gap:10px;color:#f87171;"><span style="font-size:24px;">⚠️</span> Crisis Resources</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;">
        ${CRISIS.map(c => `<div class="glass" style="border-radius:20px;padding:24px;border:1px solid ${c.border};"><div style="width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;background:${c.color};font-size:24px;">${c.icon}</div><h3 style="font-size:18px;font-weight:600;margin-bottom:10px;">${c.title}</h3><p style="color:var(--text-secondary);line-height:1.5;margin-bottom:20px;">${c.desc}</p><button onclick="handleCrisisAction('${c.action}')" class="btn-primary" style="width:100%;padding:12px;border-radius:12px;">${c.action}</button></div>`).join('')}
      </div>
    </section>
    <section style="margin-bottom:60px;">
      <h2 style="font-size:20px;font-weight:600;margin-bottom:20px;">📖 Mental Health Articles</h2>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;">
        ${ARTICLES.map((a, i) => `<div class="glass" onclick="openArticle(${i})" style="border-radius:20px;padding:24px;cursor:pointer;transition:all 0.3s ease;"><div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="font-size:12px;padding:4px 12px;background:rgba(168,85,247,0.2);color:#c4b5fd;border-radius:9999px;">${a.tag}</span><span style="color:var(--text-muted);font-size:13px;">${a.readTime}</span></div><h3 style="font-size:18px;font-weight:600;margin-bottom:12px;">${a.title}</h3><p style="color:var(--text-secondary);font-size:14px;line-height:1.5;">${a.desc}</p><p style="margin-top:16px;color:#a855f7;font-size:14px;">Read full article →</p></div>`).join('')}
      </div>
    </section>
    <section style="margin-bottom:60px;">
      <h2 style="font-size:20px;font-weight:600;margin-bottom:20px;">Frequently Asked Questions</h2>
      <div id="faqContainer" style="display:flex;flex-direction:column;gap:12px;"></div>
    </section>
    <section>
      <h2 style="font-size:20px;font-weight:600;margin-bottom:20px;">Contact Support</h2>
      <div class="glass" style="border-radius:24px;padding:32px;">
        <form onsubmit="handleContactSubmit(event)" style="max-width:600px;margin:0 auto;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">
            <div><label style="display:block;margin-bottom:8px;color:var(--text-secondary);">Name</label><input type="text" id="contactName" required class="input-glass" style="width:100%;padding:12px;border-radius:10px;"></div>
            <div><label style="display:block;margin-bottom:8px;color:var(--text-secondary);">Email</label><input type="email" id="contactEmail" required class="input-glass" style="width:100%;padding:12px;border-radius:10px;"></div>
          </div>
          <div style="margin-bottom:20px;"><label style="display:block;margin-bottom:8px;color:var(--text-secondary);">Message</label><textarea id="contactMessage" required rows="5" class="input-glass" style="width:100%;padding:12px;border-radius:10px;resize:vertical;"></textarea></div>
          <button type="submit" class="btn-primary" style="width:100%;padding:14px;border-radius:12px;font-size:16px;">Send Message</button>
        </form>
      </div>
    </section>
  </div>
  <div id="articleModal" class="glass" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:700px;max-height:85vh;overflow-y:auto;border-radius:24px;padding:0;z-index:1000;">
    <div style="padding:24px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">
      <div><span id="modalTag" style="font-size:12px;padding:4px 12px;background:rgba(168,85,247,0.2);color:#c4b5fd;border-radius:9999px;"></span><h2 id="modalTitle" style="margin-top:12px;font-size:24px;"></h2></div>
      <button onclick="closeArticleModal()" style="background:none;border:none;font-size:28px;color:var(--text-muted);cursor:pointer;">×</button>
    </div>
    <div id="modalContent" style="padding:24px;line-height:1.7;color:var(--text-secondary);"></div>
    <div style="padding:20px;border-top:1px solid rgba(255,255,255,0.1);text-align:center;"><button onclick="closeArticleModal()" class="btn-primary" style="padding:12px 40px;">Done Reading</button></div>
  </div>`;
}

function handleCrisisAction(action) {
  if (action.includes('0800567567'))    alert('Calling SADAG Suicide & Crisis Lifeline at 0800567567…');
  else if (action.includes('741741'))   alert('Texting HOME to 741741…');
  else if (action.includes('Contact'))  alert('Immediate support:\n• 0660340946\n• 0732848953\n• cebolakhemabo05@gmail.com\n• ayabongafatane@gmail.com');
  else                                  alert('Calling emergency services…');
}

function openArticle(index) {
  selectedArticle = ARTICLES[index];
  if (!selectedArticle) return;
  document.getElementById('modalTag').textContent     = selectedArticle.tag;
  document.getElementById('modalTitle').textContent   = selectedArticle.title;
  document.getElementById('modalContent').innerHTML   = `<div style="white-space:pre-wrap;">${selectedArticle.content}</div>`;
  document.getElementById('articleModal').style.display = 'block';
}
function closeArticleModal() { document.getElementById('articleModal').style.display = 'none'; }
function handleContactSubmit(e) { e.preventDefault(); alert('✅ Message sent! Our support team will reply soon.'); e.target?.reset(); }

function renderFAQs() {
  const container = document.getElementById('faqContainer');
  if (!container) return;
  container.innerHTML = FAQS.map((faq, i) => `
    <div class="glass" style="border-radius:16px;overflow:hidden;">
      <button onclick="toggleFaq(${i})" style="width:100%;padding:18px 24px;text-align:left;background:none;border:none;display:flex;justify-content:space-between;align-items:center;font-size:15px;color:var(--text-primary);cursor:pointer;">
        ${faq.q}<span style="font-size:20px;">${openFaq === i ? '−' : '+'}</span>
      </button>
      <div style="display:${openFaq === i ? 'block' : 'none'};padding:0 24px 20px;color:var(--text-secondary);">${faq.a}</div>
    </div>`).join('');
}
function toggleFaq(i) { openFaq = openFaq === i ? null : i; renderFAQs(); }

// ─────────────────────────────────────────────
//  GOOGLE SIGNIN
// ─────────────────────────────────────────────
function initGoogleSignInMainPage() {
  if (window.google?.accounts?.id) {
    google.accounts.id.initialize({ client_id: '55967579577-p1417ojnj57okrjdivfoqcvvc7vct445.apps.googleusercontent.com', callback: handleGoogleCredentialResponse, auto_select: false, cancel_on_tap_outside: true });
    renderGoogleButtons();
  }
}
function renderGoogleButtons() {
  if (!window.google?.accounts?.id) return;
  const lb = document.getElementById('googleLoginButton');
  const sb = document.getElementById('googleSignupButton');
  if (lb) google.accounts.id.renderButton(lb, { theme: 'outline', size: 'large', width: '100%', text: 'signin_with' });
  if (sb) google.accounts.id.renderButton(sb, { theme: 'outline', size: 'large', width: '100%', text: 'signup_with' });
}

// ─────────────────────────────────────────────
//  GAMES HUB
// ─────────────────────────────────────────────
function setupGamesHubEventListeners() {
  window.startGame   = gameId => { const r = document.getElementById('gamesHubRoot'); if (r) { r.innerHTML = startGame(gameId); setTimeout(() => { window.drawPuzzleCanvas?.(); window.startFocusRound?.(); }, 80); } };
  window.exitGame    = () => { showGamesHubLoading(); setTimeout(() => { if (typeof initGamesHub === 'function') initGamesHub(currentUser); const r = document.getElementById('gamesHubRoot'); if (r && typeof renderGamesHub === 'function') { r.innerHTML = renderGamesHub(); setupGamesHubEventListeners(); } }, 180); };
  window.completeGame = async points => { const r = document.getElementById('gamesHubRoot'); if (r && typeof completeGame === 'function') { const result = await completeGame(points); if (result) r.innerHTML = result; } };
  window.showGamesHub = () => { showGamesHubLoading(); setTimeout(() => { if (typeof initGamesHub === 'function') initGamesHub(currentUser); const r = document.getElementById('gamesHubRoot'); if (r && typeof renderGamesHub === 'function') { r.innerHTML = renderGamesHub(); setupGamesHubEventListeners(); setTimeout(() => { window.drawPuzzleCanvas?.(); window.startFocusRound?.(); }, 80); } }, 180); };
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

// ─────────────────────────────────────────────
//  INIT
// ─────────────────────────────────────────────
(function () {
  const saved = localStorage.getItem('ms_user');
  if (saved) {
    try { currentUser = JSON.parse(saved); load(); currentPage = 'dashboard'; } catch { localStorage.removeItem('ms_user'); }
  }
  render();
})();

// ─────────────────────────────────────────────
//  EXPOSE GLOBALS
// ─────────────────────────────────────────────
window.goto                    = goto;
window.backToDashboard         = () => goto('dashboard');
window.subscribeNewsletter     = subscribeNewsletter;
window.logout                  = logout;
window.scrollToSection         = scrollToSection;
window.submitChat              = submitChat;
window.handleLogin             = handleLogin;
window.handleSignup            = handleSignup;
window.handleResetPassword     = handleResetPassword;
window.selectMoodBtn           = selectMoodBtn;
window.submitMood              = submitMood;
window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;
window.initGoogleSignInMainPage = initGoogleSignInMainPage;
window.save                    = save;
window.load                    = load;
window.sendChat                = sendChat;
window.botResponse             = botResponse;
window.updateProgressBar       = updateProgressBar;
window.initGamesHub            = initGamesHub;
window.renderGamesHub          = renderGamesHub;
window.getRecommendedGames     = getRecommendedGames;
window.getGameState            = getGameState;
window.getRandomMotivationalMessage = getRandomMotivationalMessage;
window.handleCrisisAction      = handleCrisisAction;
window.openArticle             = openArticle;
window.closeArticleModal       = closeArticleModal;
window.handleContactSubmit     = handleContactSubmit;
window.renderFAQs              = renderFAQs;
window.toggleFaq               = toggleFaq;
