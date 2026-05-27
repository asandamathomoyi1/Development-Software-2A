require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const admin = require('firebase-admin');
const { GoogleGenAI } = require('@google/genai');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountPath =
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      './.secrets/serviceAccountKey.json';
    const serviceAccount = require(path.resolve(__dirname, serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (err) {
    console.error('❌ Firebase error:', err.message);
  }
}

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3001;

const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'admin123';
const ADMIN_GOOGLE_EMAILS = process.env.ADMIN_GOOGLE_EMAIL
  ? process.env.ADMIN_GOOGLE_EMAIL.split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  : [];

// Initialize Gemini / Vertex AI
let genAI = null;
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const vertexProject = process.env.GOOGLE_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
const vertexLocation = process.env.GOOGLE_LOCATION || process.env.GOOGLE_REGION;

if (geminiApiKey) {
  try {
    genAI = new GoogleGenAI({ apiKey: geminiApiKey });
    console.log('✅ Google Gemini API initialized successfully');
    console.log('   • GEMINI_API_KEY loaded, length:', geminiApiKey.length);
  } catch (err) {
    console.error('❌ Error initializing Google Gemini API:', err.message);
  }
} else if (vertexProject && vertexLocation) {
  try {
    genAI = new GoogleGenAI({ vertexai: true, project: vertexProject, location: vertexLocation });
    console.log('✅ Google Gemini Vertex AI initialized successfully');
    console.log(`   • project=${vertexProject} location=${vertexLocation}`);
  } catch (err) {
    console.error('❌ Error initializing Google Gemini Vertex AI:', err.message);
  }
} else {
  console.warn('⚠️ No Gemini API key or Vertex AI project/location set. Set GEMINI_API_KEY or GOOGLE_PROJECT+GOOGLE_LOCATION.');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));
app.use(express.static('HTML'));
app.use(express.static('CSS'));
app.use(express.static('JS'));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 30 * 60 * 1000 },
  })
);

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password',
  },
});

// Data stores
let users = [];
let adminSettings = {};
let otpStore = {};

// Initialize data from Firestore
async function initializeData() {
  try {
    const usersSnapshot = await db.collection('users').get();
    users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`Loaded ${users.length} users from Firestore`);
  } catch (err) {
    console.log('Error loading users from Firestore:', err);
  }
  try {
    const settingsDoc = await db
      .collection('admin_settings')
      .doc('config')
      .get();
    if (settingsDoc.exists) {
      adminSettings = settingsDoc.data();
    }
    console.log('Loaded admin settings from Firestore');
  } catch (err) {
    console.log('Error loading admin settings from Firestore:', err);
  }
}

initializeData();

// Helper functions
function parseMoodValue(mood) {
  if (typeof mood === 'number' && Number.isFinite(mood)) return mood;
  if (typeof mood === 'string') {
    const trimmed = mood.trim();
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) return numeric;
    const m = trimmed.toLowerCase();
    if (m === 'very low') return 1;
    if (m === 'low') return 2;
    if (m === 'neutral') return 3;
    if (m === 'good') return 4;
    if (m === 'great' || m === 'excellent') return 5;
  }
  return null;
}

function moodScore(mood) {
  const value = parseMoodValue(mood);
  return value >= 1 && value <= 5 ? value : 3;
}

function normalizeMoodLabel(mood, fallbackLabel) {
  const value = parseMoodValue(mood);
  if (value === 1) return 'Very Low';
  if (value === 2) return 'Low';
  if (value === 3) return 'Neutral';
  if (value === 4) return 'Good';
  if (value === 5) return 'Great';
  return fallbackLabel || 'Neutral';
}

async function saveUsers() {
  try {
    const batch = db.batch();
    users.forEach((user) => {
      const userRef = db.collection('users').doc(user.id);
      batch.set(userRef, user, { merge: true });
    });
    await batch.commit();
    console.log('Users saved to Firestore');
  } catch (err) {
    console.error('Error saving users to Firestore:', err);
  }
}

async function saveAdminSettings() {
  try {
    await db
      .collection('admin_settings')
      .doc('config')
      .set(adminSettings, { merge: true });
    console.log('Admin settings saved to Firestore');
  } catch (err) {
    console.error('Error saving admin settings to Firestore:', err);
  }
}

function parseMoodEntryDate(entry) {
  if (entry.timestamp) {
    if (entry.timestamp.toDate) return entry.timestamp.toDate();
    const parsed = new Date(entry.timestamp);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (entry.date) {
    const parsedDate = new Date(entry.date);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
  }
  return new Date(0);
}

async function getMoodEntriesForUser(userId) {
  if (!userId) return [];
  const snapshot = await db
    .collection('mood_entries')
    .where('userId', '==', String(userId))
    .get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort(
      (a, b) =>
        parseMoodEntryDate(b).getTime() - parseMoodEntryDate(a).getTime()
    );
}

async function getAllMoodEntries() {
  const snapshot = await db.collection('mood_entries').get();
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort(
      (a, b) =>
        parseMoodEntryDate(b).getTime() - parseMoodEntryDate(a).getTime()
    );
}

async function deleteMoodEntryById(entryId) {
  if (!entryId) return;
  await db.collection('mood_entries').doc(String(entryId)).delete();
}

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent to:', email);
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
}

function getUserName(user) {
  return user.name || user.username || user.email.split('@')[0] || 'User';
}

function findUserByEmail(email) {
  return users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
}

async function createOrFindOauthUser(provider, providerId, email, name) {
  let user = findUserByEmail(email);
  if (user) {
    user.provider = provider;
    user.providerId = providerId;
    await saveUsers();
    return user;
  }
  const id = Date.now().toString();
  user = {
    id,
    email,
    password: `${provider}_oauth`,
    provider,
    providerId,
    name: name || getUserName({ email }),
  };
  users.push(user);
  await saveUsers();
  return user;
}

async function verifyGoogleToken(idToken) {
  if (!idToken) throw new Error('Missing Google ID token');
  const googleClientId =
    process.env.GOOGLE_CLIENT_ID ||
    '55967579577-p1417ojnj57okrjdivfoqcvvc7vct445.apps.googleusercontent.com';
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Invalid Google token');
  const payload = await response.json();
  if (googleClientId && payload.aud !== googleClientId) {
    throw new Error('Token audience does not match Google client ID');
  }
  return payload;
}

function requireAdmin(req, res, next) {
  const sessionTimeout = (adminSettings.sessionTimeout || 30) * 60 * 1000;
  if (
    !req.session.is_admin ||
    Date.now() - req.session.last_activity > sessionTimeout
  ) {
    return res.redirect('/admin-login.html?error=expired');
  }
  req.session.last_activity = Date.now();
  next();
}

function isAdminGoogleEmail(email) {
  if (!email) return false;
  if (ADMIN_GOOGLE_EMAILS.length === 0) return true;
  return ADMIN_GOOGLE_EMAILS.includes(String(email).toLowerCase());
}

// ===== MAIN ROUTES =====
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'MainPage.html'));
});

// ===== GAMES HUB API ROUTES =====
app.get('/api/games/stats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const statsRef = db.collection('game_stats').doc(userId);
    const statsDoc = await statsRef.get();

    if (statsDoc.exists) {
      res.json(statsDoc.data());
    } else {
      res.json({
        gamesPlayed: 0,
        totalPoints: 0,
        badges: [],
        memoryGamesPlayed: 0,
        puzzleGamesPlayed: 0,
        coloringGamesPlayed: 0,
        focusGamesPlayed: 0,
        triviaGamesPlayed: 0,
      });
    }
  } catch (error) {
    console.error('Error fetching game stats:', error);
    res.status(500).json({ error: 'Failed to fetch game stats' });
  }
});

app.post('/api/games/stats', async (req, res) => {
  try {
    const { userId, stats, gameId, points, timestamp } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'UserId is required' });
    }

    const statsRef = db.collection('game_stats').doc(userId);
    const existingStats = await statsRef.get();

    let updatedStats = { ...stats };

    if (gameId) {
      if (gameId.includes('memory')) {
        updatedStats.memoryGamesPlayed =
          (updatedStats.memoryGamesPlayed || 0) + 1;
      } else if (gameId.includes('puzzle')) {
        updatedStats.puzzleGamesPlayed =
          (updatedStats.puzzleGamesPlayed || 0) + 1;
      } else if (gameId.includes('coloring')) {
        updatedStats.coloringGamesPlayed =
          (updatedStats.coloringGamesPlayed || 0) + 1;
      } else if (gameId.includes('focus')) {
        updatedStats.focusGamesPlayed =
          (updatedStats.focusGamesPlayed || 0) + 1;
      } else if (gameId.includes('trivia')) {
        updatedStats.triviaGamesPlayed =
          (updatedStats.triviaGamesPlayed || 0) + 1;
      }
    }

    await statsRef.set(updatedStats, { merge: true });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving game stats:', error);
    res.status(500).json({ error: 'Failed to save game stats' });
  }
});

// ===== AUTH ROUTES =====
app.post('/register', async (req, res) => {
  try {
    const { id, name, username, email, password } = req.body;
    const displayName =
      name || username || (email ? email.split('@')[0] : 'User');
    const existingUser = users.find((u) => u.email === email);
    if (existingUser)
      return res.status(400).json({ error: 'User already exists' });
    const newUser = {
      id: id || Date.now().toString(),
      name: displayName,
      email,
      password,
    };
    users.push(newUser);
    await saveUsers();
    res.json({ success: true });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    (u) => u.email.toLowerCase() === String(email).toLowerCase()
  );
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  req.session.user = {
    id: user.id,
    email: user.email,
    name: getUserName(user),
  };
  res.json({ success: true, user: req.session.user });
});

app.options('/oauth/google', cors());
app.post('/oauth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    const payload = await verifyGoogleToken(idToken);
    const user = await createOrFindOauthUser(
      'google',
      payload.sub,
      payload.email,
      payload.name || payload.email.split('@')[0]
    );
    req.session.user = {
      id: user.id,
      email: user.email,
      name: getUserName(user),
    };
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(400).json({ error: error.message || 'Google OAuth failed' });
  }
});

// ===== MOOD ENTRY ROUTES =====
app.get('/mood-entries', async (req, res) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    const snapshot = await db
      .collection('mood_entries')
      .where('userId', '==', userId)
      .limit(100)
      .get();
    let entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    entries = entries
      .sort((a, b) => {
        const aTs = a.timestamp
          ? a.timestamp.toMillis
            ? a.timestamp.toMillis()
            : Date.parse(a.date || '')
          : 0;
        const bTs = b.timestamp
          ? b.timestamp.toMillis
            ? b.timestamp.toMillis()
            : Date.parse(b.date || '')
          : 0;
        return bTs - aTs;
      })
      .slice(0, 30);
    res.json({ success: true, entries });
  } catch (error) {
    console.error('Load mood entries error:', error);
    res.status(500).json({ error: 'Failed to load mood entries' });
  }
});

app.post('/mood-entry', async (req, res) => {
  try {
    const { userId, mood, moodLabel, feeling } = req.body;
    const moodValue = parseMoodValue(mood);
    if (!userId || moodValue === null || moodValue < 1 || moodValue > 5) {
      return res.status(400).json({ error: 'Missing or invalid mood data' });
    }
    const normalizedMoodLabel = normalizeMoodLabel(moodValue, moodLabel);
    const docRef = await db.collection('mood_entries').add({
      userId,
      mood: moodValue,
      moodLabel: normalizedMoodLabel,
      feeling: feeling || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      date: new Date().toLocaleDateString(),
    });
    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Save mood entry error:', error);
    res.status(500).json({ error: 'Failed to save mood entry' });
  }
});

// ===== AI CHAT ROUTE - AUTO MODEL DETECTION =====
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  console.log('📨 Chat request received:', message);

  if (!genAI) {
    console.log('❌ genAI is null - API key not loaded');
    return res.json({
      reply:
        "I'm here for you. Could you tell me more about how you're feeling?",
      success: true,
    });
  }

  console.log('✅ genAI exists, trying models...');

  const modelNames = [
    'gemini-2.5-flash',
    'gemini-2.1',
    'gemini-1.5-flash',
    'gemini-1.0-pro',
  ];

  let lastError = null;
  let reply = null;
  let workingModel = null;

  for (const modelName of modelNames) {
    try {
      console.log(`🔄 Trying model: ${modelName}`);
      const result = await genAI.models.generateContent({
        model: modelName,
        contents: message || 'Hello!',
      });
      reply = result.text?.trim();

      if (reply) {
        workingModel = modelName;
        console.log(`✅ SUCCESS! Model ${modelName} returned text.`);
        break;
      }
    } catch (err) {
      lastError = err;
      console.log(`❌ Model ${modelName} failed:`, err?.message || err);
    }
  }

  if (!reply || !reply.trim()) {
    console.error('❌ All models failed. Last error:', lastError?.message);
    return res.json({
      reply:
        "I'm here for you. Could you tell me more about how you're feeling?",
      success: true,
    });
  }

  console.log(`💬 Response from ${workingModel}:`, reply.substring(0, 100));
  return res.json({ reply, success: true });
});

// ===== NEWSLETTER & OTP ROUTES =====
app.post('/subscribe', (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  sendOTPEmail(email, otp);
  res.json({ success: true, message: 'OTP sent to your email' });
});

app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore[email];
  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  delete otpStore[email];
  res.json({ success: true, message: 'Verified' });
});

app.post('/reset-password', (req, res) => {
  const { email } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  sendOTPEmail(email, otp);
  res.json({ success: true, message: 'OTP sent' });
});

app.post('/update-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = users.find((u) => u.email === email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.password = newPassword;
    await saveUsers();
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ===== ADMIN ROUTES =====
app.get('/admin-login', (req, res) => res.redirect('/admin-login.html'));

app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.is_admin = true;
    req.session.last_activity = Date.now();
    res.redirect('/admin-dashboard');
  } else {
    res.redirect('/admin-login.html?error=1');
  }
});

app.options('/oauth/google-admin', cors());
app.post('/oauth/google-admin', async (req, res) => {
  try {
    const { idToken } = req.body;
    const payload = await verifyGoogleToken(idToken);
    if (!isAdminGoogleEmail(payload.email)) {
      return res
        .status(403)
        .json({ error: 'Google account is not authorized for admin access' });
    }
    req.session.is_admin = true;
    req.session.last_activity = Date.now();
    res.json({ success: true });
  } catch (error) {
    console.error('Admin Google OAuth error:', error);
    res
      .status(400)
      .json({ error: error.message || 'Google admin OAuth failed' });
  }
});

app.post('/oauth/apple', async (req, res) => {
  try {
    const { email, name, providerId } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ error: 'Email is required for Apple login' });
    const user = await createOrFindOauthUser(
      'apple',
      providerId || email,
      email,
      name || email.split('@')[0]
    );
    req.session.user = {
      id: user.id,
      email: user.email,
      name: getUserName(user),
    };
    res.json({ success: true, user: req.session.user });
  } catch (error) {
    console.error('Apple OAuth error:', error);
    res.status(500).json({ error: 'Apple login failed' });
  }
});

app.get('/admin-settings', requireAdmin, (req, res) => {
  res.send(
    `<!DOCTYPE html><html><head><title>Admin Settings</title><link rel="stylesheet" href="/admin-style.css"></head><body><div class="admin-layout"><aside class="sidebar"><div class="brand"><h2>Digital Mental Health Platform</h2><p>Settings</p></div><nav><a href="/admin-dashboard">Dashboard</a><a href="/admin-users">Users</a><a href="/admin-analytics">Mood Analytics</a><a class="active" href="/admin-settings">Settings</a><a href="/admin-logout">Logout</a></nav></aside><main class="main-content"><header class="page-header"><div><h1>Settings</h1><p class="page-meta">Configure platform settings and preferences.</p></div></header><section><form method="post" action="/admin-settings"><div class="form-group"><label for="siteTitle">Site Title</label><input type="text" id="siteTitle" name="siteTitle" value="${adminSettings.siteTitle || 'Digital Mental Health Platform'}" required></div><div class="form-group"><label for="adminEmail">Admin Email</label><input type="email" id="adminEmail" name="adminEmail" value="${adminSettings.adminEmail || 'admin@example.com'}" required></div><div class="form-group"><label for="sessionTimeout">Session Timeout (minutes)</label><input type="number" id="sessionTimeout" name="sessionTimeout" value="${adminSettings.sessionTimeout || 30}" min="10" max="120" required></div><button type="submit" class="btn btn-primary">Save Settings</button></form></section></main></div></body></html>`
  );
});

app.post('/admin-settings', requireAdmin, async (req, res) => {
  try {
    adminSettings = { ...adminSettings, ...req.body };
    await saveAdminSettings();
    res.redirect('/admin-settings');
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

app.get('/users', (req, res) => res.json(users));

app.get('/admin-dashboard', requireAdmin, async (req, res) => {
  const totalUsers = users.length;
  const allEntries = await getAllMoodEntries();
  const totalMoodEntries = allEntries.length;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const activeUserIdsToday = new Set();
  const moodDistribution = {
    'Very Low': 0,
    Low: 0,
    Neutral: 0,
    Good: 0,
    Great: 0,
  };
  let sumMoodScores = 0,
    subjectMoodCount = 0;
  allEntries.forEach((entry) => {
    const mood = normalizeMoodLabel(entry.mood, entry.moodLabel);
    moodDistribution[mood]++;
    sumMoodScores += moodScore(entry.mood);
    subjectMoodCount++;
    const entryDate = parseMoodEntryDate(entry);
    if (entryDate.toDateString() === todayStart.toDateString() && entry.userId)
      activeUserIdsToday.add(entry.userId);
  });
  const activeToday = activeUserIdsToday.size;
  const avgMoodScore =
    subjectMoodCount > 0 ? (sumMoodScores / subjectMoodCount).toFixed(1) : 0;
  res.send(
    `<!DOCTYPE html><html><head><title>Admin Dashboard</title><link rel="stylesheet" href="/admin-style.css"><script src="https://cdn.jsdelivr.net/npm/chart.js"></script></head><body><div class="admin-layout"><aside class="sidebar"><div class="brand"><h2>Digital Mental Health Platform</h2><p>Admin Panel</p></div><nav><a class="active" href="/admin-dashboard">Dashboard</a><a href="/admin-users">Users</a><a href="/admin-analytics">Mood Analytics</a><a href="/admin-settings">Settings</a><a href="/admin-logout">Logout</a></nav></aside><main class="main-content"><header class="page-header"><div><h1>Dashboard</h1><p class="page-meta">Overview of platform usage and user activity.</p></div></header><section class="stats-grid"><div class="card"><h2>Total Users</h2><p class="stat-value">${totalUsers}</p><p>Registered users on the platform.</p></div><div class="card"><h2>Total Mood Entries</h2><p class="stat-value">${totalMoodEntries}</p><p>Mood submissions across all users.</p></div><div class="card"><h2>Active Today</h2><p class="stat-value">${activeToday}</p><p>Users who logged mood data today.</p></div><div class="card"><h2>Average Mood Score</h2><p class="stat-value">${avgMoodScore}</p><p>Overall mood rating (1-5 scale).</p></div></section><section class="chart-section"><h2>Mood Distribution</h2><canvas id="moodChart" width="400" height="200"></canvas></section></main></div><script>new Chart(document.getElementById('moodChart').getContext('2d'),{type:'bar',data:{labels:${JSON.stringify(Object.keys(moodDistribution))},datasets:[{label:'Mood Count',data:${JSON.stringify(Object.values(moodDistribution))},backgroundColor:'rgba(59,130,246,0.5)',borderColor:'rgba(59,130,246,1)',borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});</script></body></html>`
  );
});

app.get('/admin-analytics', requireAdmin, async (req, res) => {
  const moodDistribution = {
    'Very Low': 0,
    Low: 0,
    Neutral: 0,
    Good: 0,
    Great: 0,
  };
  const dailyCounts = {};
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 29);
  for (let i = 0; i < 30; i++) {
    const date = new Date(periodStart);
    date.setDate(date.getDate() + i);
    dailyCounts[date.toISOString().split('T')[0]] = 0;
  }
  let activeToday = 0,
    activeWeek = 0,
    activeMonth = 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 29);
  const allEntries = await getAllMoodEntries();
  allEntries.forEach((entry) => {
    const mood = normalizeMoodLabel(entry.mood, entry.moodLabel);
    moodDistribution[mood]++;
    const entryDate = parseMoodEntryDate(entry);
    const dateStr = entryDate.toISOString().split('T')[0];
    if (dailyCounts[dateStr] !== undefined) dailyCounts[dateStr]++;
    if (entryDate >= todayStart) activeToday++;
    if (entryDate >= weekStart) activeWeek++;
    if (entryDate >= monthStart) activeMonth++;
  });
  if (req.query.export === 'csv') {
    let csv = `Metric,Value\nActive users today,${activeToday}\nActive users last 7 days,${activeWeek}\nActive users last 30 days,${activeMonth}\n\nMood Category,Count\n`;
    Object.entries(moodDistribution).forEach(
      ([label, count]) => (csv += `${label},${count}\n`)
    );
    res.header('Content-Type', 'text/csv');
    res.header(
      'Content-Disposition',
      'attachment; filename=analytics-report.csv'
    );
    return res.send(csv);
  }
  const chartLabels = Object.keys(dailyCounts).map((d) =>
    new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })
  );
  const chartValues = Object.values(dailyCounts);
  res.send(
    `<!DOCTYPE html><html><head><title>Mood Analytics</title><link rel="stylesheet" href="/admin-style.css"><script src="https://cdn.jsdelivr.net/npm/chart.js"></script></head><body><div class="admin-layout"><aside class="sidebar"><div class="brand"><h2>Digital Mental Health Platform</h2><p>Analytics</p></div><nav><a href="/admin-dashboard">Dashboard</a><a href="/admin-users">Users</a><a class="active" href="/admin-analytics">Mood Analytics</a><a href="/admin-settings">Settings</a><a href="/admin-logout">Logout</a></nav></aside><main class="main-content"><header class="page-header"><div><h1>Mood Analytics</h1><p class="page-meta">Track mood behavior, active participation, and export measurement reports.</p></div><div><a class="btn btn-primary" href="/admin-analytics?export=csv">Export CSV</a></div></header><section class="stats-grid"><div class="card"><h2>Active Today</h2><p class="stat-value">${activeToday}</p><p>Unique users who submitted mood data within the last 24 hours.</p></div><div class="card"><h2>Active Last 7 Days</h2><p class="stat-value">${activeWeek}</p><p>Users with recent engagement over one week.</p></div><div class="card"><h2>Active Last 30 Days</h2><p class="stat-value">${activeMonth}</p><p>Users with recent engagement over one month.</p></div></section><section class="chart-section"><h2>Daily Mood Entries (Last 30 Days)</h2><canvas id="dailyChart"></canvas></section><section class="chart-section"><h2>Mood Distribution</h2><canvas id="moodChart"></canvas></section></main></div><script>new Chart(document.getElementById('dailyChart').getContext('2d'),{type:'line',data:{labels:${JSON.stringify(chartLabels)},datasets:[{label:'Mood Entries',data:${JSON.stringify(chartValues)},backgroundColor:'rgba(59,130,246,0.2)',borderColor:'rgba(59,130,246,1)',borderWidth:2}]},options:{scales:{y:{beginAtZero:true}}}});new Chart(document.getElementById('moodChart').getContext('2d'),{type:'pie',data:{labels:${JSON.stringify(Object.keys(moodDistribution))},datasets:[{data:${JSON.stringify(Object.values(moodDistribution))},backgroundColor:['#ef4444','#f97316','#eab308','#22c55e','#38bdf8']}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{color:'#f5f5f7'}}}}});</script></body></html>`
  );
});

app.get('/admin-users', requireAdmin, async (req, res) => {
  const rows = await Promise.all(
    users.map(async (user) => {
      const entries = await getMoodEntriesForUser(user.id);
      return `<tr><td>${user.name}</td><td>${user.email}</td><td>${entries.length}<tr><td><a class="btn btn-primary" href="/admin-users/view/${user.id}">View</a><form method="post" action="/admin-users/delete" style="display:inline;margin-left:8px;"><input type="hidden" name="user_id" value="${user.id}"><button type="submit" class="btn btn-danger">Delete</button></form></tr>`;
    })
  );
  res.send(
    `<!DOCTYPE html><html><head><title>Users</title><link rel="stylesheet" href="/admin-style.css"></head><body><div class="admin-layout"><aside class="sidebar"><div class="brand"><h2>Digital Mental Health Platform</h2><p>Users</p></div><nav><a href="/admin-dashboard">Dashboard</a><a class="active" href="/admin-users">Users</a><a href="/admin-analytics">Mood Analytics</a><a href="/admin-settings">Settings</a><a href="/admin-logout">Logout</a></nav></aside><main class="main-content"><header class="page-header"><div><h1>Users</h1><p class="page-meta">Manage registered users and their data.</p></div></header><section><table><thead><tr><th>Name</th><th>Email</th><th>Mood Entries</th><th>Actions</th></tr></thead><tbody>${rows.join('')}</tbody></table></section></main></div></body></html>`
  );
});

app.get('/admin-users/view/:id', requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const user = users.find((u) => u.id === userId);
  if (!user) return res.redirect('/admin-users');
  const entries = await getMoodEntriesForUser(userId);
  const entryRows = entries
    .map(
      (entry) =>
        `<tr><td>${entry.date || ''}</td><td>${entry.mood || ''}</td><td>${entry.moodLabel || ''}</td><td>${entry.feeling || ''}</td><td><form method="post" action="/admin-users/${entry.id}/delete-entry"><input type="hidden" name="user_id" value="${userId}"><button type="submit" class="btn btn-danger">Delete</button></form></td></tr>`
    )
    .join('');
  res.send(
    `<!DOCTYPE html><html><head><title>User Details - ${user.name}</title><link rel="stylesheet" href="/admin-style.css"></head><body><div class="admin-layout"><aside class="sidebar"><div class="brand"><h2>Digital Mental Health Platform</h2><p>User Details</p></div><nav><a href="/admin-dashboard">Dashboard</a><a href="/admin-users">Users</a><a href="/admin-analytics">Mood Analytics</a><a href="/admin-settings">Settings</a><a href="/admin-logout">Logout</a></nav></aside><main class="main-content"><header class="page-header"><div><h1>${user.name}</h1><p class="page-meta">View and manage this user's account and mood entries.</p></div></header><section class="user-details"><h2>User Info</h2><form method="post" action="/admin-users/update"><input type="hidden" name="user_id" value="${user.id}"><label>Name</label><input type="text" name="name" value="${user.name || ''}" required><label>Email</label><input type="email" name="email" value="${user.email || ''}" required><div><button type="submit" class="btn btn-primary">Save</button><a href="/admin-users" class="btn btn-secondary">Back to users</a></div></form></section><section class="mood-entries-section"><h2>Mood Entries</h2><form method="post" action="/admin-users/${user.id}/add-entry"><div><div><label>Date</label><input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required></div><div><label>Mood</label><input type="text" name="mood" placeholder="Good" required></div><div><label>Label</label><input type="text" name="moodLabel" placeholder="Good" required></div><div><label>Feeling</label><input type="text" name="feeling" placeholder="How they felt" required></div></div><button type="submit" class="btn btn-primary">Add Mood Entry</button></form><table><thead><tr><th>Date</th><th>Mood</th><th>Label</th><th>Feeling</th><th>Actions</th></tr></thead><tbody>${entryRows || '<tr><td colspan="5">No mood entries yet.</td></tr>'}</tbody></table></section></main></div></body></html>`
  );
});

app.post('/admin-users/update', requireAdmin, async (req, res) => {
  try {
    const { user_id, name, email } = req.body;
    const user = users.find((u) => u.id === user_id);
    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      await saveUsers();
    }
    res.redirect(`/admin-users/view/${user_id}`);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.post('/admin-users/:userId/add-entry', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { mood, moodLabel, feeling, date } = req.body;
    if (!userId || !mood || !moodLabel)
      return res.status(400).json({ error: 'Missing entry data' });
    await db.collection('mood_entries').add({
      userId,
      mood,
      moodLabel,
      feeling: feeling || '',
      timestamp: date
        ? admin.firestore.Timestamp.fromDate(new Date(date))
        : admin.firestore.FieldValue.serverTimestamp(),
      date: date || new Date().toLocaleDateString(),
    });
    res.redirect(`/admin-users/view/${userId}`);
  } catch (err) {
    console.error('Error adding mood entry:', err);
    res.status(500).json({ error: 'Failed to add mood entry' });
  }
});

app.post(
  '/admin-users/:entryId/delete-entry',
  requireAdmin,
  async (req, res) => {
    try {
      const entryId = req.params.entryId;
      const { user_id } = req.body;
      if (!entryId) return res.status(400).json({ error: 'Missing entry id' });
      await deleteMoodEntryById(entryId);
      res.redirect(`/admin-users/view/${user_id}`);
    } catch (err) {
      console.error('Error deleting mood entry:', err);
      res.status(500).json({ error: 'Failed to delete mood entry' });
    }
  }
);

app.post('/admin-users/delete', requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;
    const index = users.findIndex((u) => u.id === user_id);
    if (index !== -1) {
      users.splice(index, 1);
      await saveUsers();
      const entries = await getMoodEntriesForUser(user_id);
      for (const entry of entries) await deleteMoodEntryById(entry.id);
    }
    res.redirect('/admin-users');
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.get('/admin-logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin-login.html');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`💬 Chat endpoint: http://localhost:${PORT}/api/chat`);
});
