// import express from 'express';
// import bodyParser from 'body-parser';
// import cors from 'cors';
// import nodemailer from 'nodemailer';
// import crypto from 'crypto';
// import fs from 'fs';
// import path from 'path';
// import session from 'express-session';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// import { admin, db } from './firebase-admin-config.js';
// import { GoogleGenerativeAI } from '@google/generative-ai';
// import 'dotenv/config';

// // Create __dirname for ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const app = express();
// const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
// const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'admin123';
// const ADMIN_GOOGLE_EMAILS = process.env.ADMIN_GOOGLE_EMAIL
//   ? process.env.ADMIN_GOOGLE_EMAIL.split(',')
//       .map((v) => v.trim().toLowerCase())
//       .filter(Boolean)
//   : [];
// const PORT = process.env.PORT || 3001;

// // Initialize Gemini AI
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // Middleware
// app.use(cors());
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(
//   session({
//     secret: 'your-secret-key', // Change this to a secure key
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: false }, // Set to true if using HTTPS
//   })
// );

// // Serve static files
// app.use(express.static(path.join(__dirname)));

// // Root route - serve the main application
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'HTML', 'MainPage.html'));
// });

// // Middleware to check admin auth
// function requireAdmin(req, res, next) {
//   const sessionTimeout = 1800 * 1000; // 30 minutes
//   if (
//     !req.session.is_admin ||
//     Date.now() - req.session.last_activity > sessionTimeout
//   ) {
//     return res.redirect('/admin-login.html?error=expired');
//   }
//   req.session.last_activity = Date.now();
//   next();
// }

// // Email transporter (configure with your email service)
// const transporter = nodemailer.createTransport({
//   service: 'gmail', // or your email service
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@gmail.com',
//     pass: process.env.EMAIL_PASS || 'your-app-password',
//   },
// });

// // In-memory storage for simplicity (use database in production)
// let users = [];
// let adminSettings = {};
// let otpStore = {}; // Store OTPs temporarily

// // Initialize data from Firestore on startup
// async function initializeData() {
//   try {
//     // Load users
//     const usersSnapshot = await db.collection('users').get();
//     users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//     console.log(`Loaded ${users.length} users from Firestore`);
//   } catch (err) {
//     console.log('Error loading users from Firestore:', err);
//   }

//   try {
//     // Load admin settings
//     const settingsDoc = await db
//       .collection('admin_settings')
//       .doc('config')
//       .get();
//     if (settingsDoc.exists) {
//       adminSettings = settingsDoc.data();
//     }
//     console.log('Loaded admin settings from Firestore');
//   } catch (err) {
//     console.log('Error loading admin settings from Firestore:', err);
//   }
// }

// // Initialize data on startup
// initializeData();

// // Helper functions
// function parseMoodValue(mood) {
//   if (typeof mood === 'number' && Number.isFinite(mood)) {
//     return mood;
//   }
//   if (typeof mood === 'string') {
//     const trimmed = mood.trim();
//     const numeric = Number(trimmed);
//     if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
//       return numeric;
//     }
//     const m = trimmed.toLowerCase();
//     if (m === 'very low') return 1;
//     if (m === 'low') return 2;
//     if (m === 'neutral') return 3;
//     if (m === 'good') return 4;
//     if (m === 'great' || m === 'excellent') return 5;
//   }
//   return null;
// }

// function moodScore(mood) {
//   const value = parseMoodValue(mood);
//   return value >= 1 && value <= 5 ? value : 3;
// }

// function normalizeMoodLabel(mood, fallbackLabel) {
//   const value = parseMoodValue(mood);
//   if (value === 1) return 'Very Low';
//   if (value === 2) return 'Low';
//   if (value === 3) return 'Neutral';
//   if (value === 4) return 'Good';
//   if (value === 5) return 'Great';

//   if (fallbackLabel && typeof fallbackLabel === 'string') {
//     return normalizeMoodLabel(fallbackLabel);
//   }
//   return 'Neutral';
// }

// // Save users to Firestore
// async function saveUsers() {
//   try {
//     // Save each user to Firestore
//     const batch = db.batch();
//     users.forEach((user) => {
//       const userRef = db.collection('users').doc(user.id);
//       batch.set(userRef, user, { merge: true });
//     });
//     await batch.commit();
//     console.log('Users saved to Firestore');
//   } catch (err) {
//     console.error('Error saving users to Firestore:', err);
//   }
// }

// // Save admin settings to Firestore
// async function saveAdminSettings() {
//   try {
//     await db
//       .collection('admin_settings')
//       .doc('config')
//       .set(adminSettings, { merge: true });
//     console.log('Admin settings saved to Firestore');
//   } catch (err) {
//     console.error('Error saving admin settings to Firestore:', err);
//   }
// }

// function parseMoodEntryDate(entry) {
//   if (entry.timestamp) {
//     if (entry.timestamp.toDate) {
//       return entry.timestamp.toDate();
//     }
//     const parsed = new Date(entry.timestamp);
//     if (!Number.isNaN(parsed.getTime())) return parsed;
//   }
//   if (entry.date) {
//     const parsedDate = new Date(entry.date);
//     if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
//   }
//   if (entry.createdAt) {
//     const parsedCreated = entry.createdAt.toDate
//       ? entry.createdAt.toDate()
//       : new Date(entry.createdAt);
//     if (!Number.isNaN(parsedCreated.getTime())) return parsedCreated;
//   }
//   return new Date(0);
// }

// async function getMoodEntriesForUser(userId) {
//   if (!userId) return [];
//   const snapshot = await db
//     .collection('mood_entries')
//     .where('userId', '==', String(userId))
//     .get();
//   // Sort in JavaScript to avoid requiring composite index
//   return snapshot.docs
//     .map((doc) => ({ id: doc.id, ...doc.data() }))
//     .sort(
//       (a, b) =>
//         parseMoodEntryDate(b).getTime() - parseMoodEntryDate(a).getTime()
//     );
// }

// async function getAllMoodEntries() {
//   const snapshot = await db.collection('mood_entries').get();
//   return snapshot.docs
//     .map((doc) => ({ id: doc.id, ...doc.data() }))
//     .sort(
//       (a, b) =>
//         parseMoodEntryDate(b).getTime() - parseMoodEntryDate(a).getTime()
//     );
// }

// async function deleteMoodEntryById(entryId) {
//   if (!entryId) return;
//   await db.collection('mood_entries').doc(String(entryId)).delete();
// }

// // Generate OTP
// function generateOTP() {
//   return crypto.randomInt(100000, 999999).toString();
// }

// // Send OTP email
// async function sendOTPEmail(email, otp) {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Your OTP Code',
//     text: `Your OTP code is: ${otp}. It expires in 10 minutes.`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('OTP email sent to:', email);
//   } catch (error) {
//     console.error('Error sending OTP email:', error);
//   }
// }

// // Routes

// function getUserName(user) {
//   return user.name || user.username || user.email.split('@')[0] || 'User';
// }

// function findUserByEmail(email) {
//   return users.find(
//     (u) => u.email.toLowerCase() === String(email).toLowerCase()
//   );
// }

// async function createOrFindOauthUser(provider, providerId, email, name) {
//   let user = findUserByEmail(email);
//   if (user) {
//     user.provider = provider;
//     user.providerId = providerId;
//     await saveUsers();
//     return user;
//   }
//   const id = Date.now().toString();
//   user = {
//     id,
//     email,
//     password: `${provider}_oauth`,
//     provider,
//     providerId,
//     name: name || getUserName({ email }),
//   };
//   users.push(user);
//   await saveUsers();
//   return user;
// }

// async function verifyGoogleToken(idToken) {
//   if (!idToken) throw new Error('Missing Google ID token');
//   const googleClientId =
//     process.env.GOOGLE_CLIENT_ID ||
//     '55967579577-p1417ojnj57okrjdivfoqcvvc7vct445.apps.googleusercontent.com';
//   const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
//   const response = await fetch(url);
//   if (!response.ok) throw new Error('Invalid Google token');
//   const payload = await response.json();
//   if (googleClientId && payload.aud !== googleClientId) {
//     throw new Error('Token audience does not match Google client ID');
//   }
//   return payload;
// }

// // Register user
// app.post('/register', async (req, res) => {
//   try {
//     const { id, name, username, email, password } = req.body;
//     const displayName =
//       name || username || (email ? email.split('@')[0] : 'User');
//     const existingUser = users.find((u) => u.email === email);
//     if (existingUser) {
//       return res.status(400).json({ error: 'User already exists' });
//     }
//     const newUser = {
//       id: id || Date.now().toString(),
//       name: displayName,
//       email,
//       password,
//     };
//     users.push(newUser);
//     await saveUsers();
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Register error:', err);
//     res.status(500).json({ error: 'Registration failed' });
//   }
// });

// // Local login
// app.post('/login', (req, res) => {
//   const { email, password } = req.body;
//   const user = users.find(
//     (u) => u.email.toLowerCase() === String(email).toLowerCase()
//   );
//   if (!user || user.password !== password) {
//     return res.status(401).json({ error: 'Invalid email or password' });
//   }
//   req.session.user = {
//     id: user.id,
//     email: user.email,
//     name: getUserName(user),
//   };
//   res.json({ success: true, user: req.session.user });
// });

// function isAdminGoogleEmail(email) {
//   if (!email) return false;
//   if (ADMIN_GOOGLE_EMAILS.length === 0) return true;
//   return ADMIN_GOOGLE_EMAILS.includes(String(email).toLowerCase());
// }

// // OAuth login for Google
// app.options('/oauth/google', cors());
// app.post('/oauth/google', async (req, res) => {
//   try {
//     const { idToken } = req.body;
//     const payload = await verifyGoogleToken(idToken);
//     const user = await createOrFindOauthUser(
//       'google',
//       payload.sub,
//       payload.email,
//       payload.name || payload.email.split('@')[0]
//     );
//     req.session.user = {
//       id: user.id,
//       email: user.email,
//       name: getUserName(user),
//     };
//     res.json({ success: true, user: req.session.user });
//   } catch (error) {
//     console.error('Google OAuth error:', error);
//     res.status(400).json({ error: error.message || 'Google OAuth failed' });
//   }
// });

// app.get('/mood-entries', async (req, res) => {
//   try {
//     const userId = String(req.query.userId || '').trim();
//     if (!userId) {
//       return res.status(400).json({ error: 'Missing userId' });
//     }
//     const snapshot = await db
//       .collection('mood_entries')
//       .where('userId', '==', userId)
//       .limit(100)
//       .get();
//     let entries = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
//     entries = entries
//       .sort((a, b) => {
//         const aTs = a.timestamp
//           ? a.timestamp.toMillis
//             ? a.timestamp.toMillis()
//             : Date.parse(a.date || '')
//           : 0;
//         const bTs = b.timestamp
//           ? b.timestamp.toMillis
//             ? b.timestamp.toMillis()
//             : Date.parse(b.date || '')
//           : 0;
//         return bTs - aTs;
//       })
//       .slice(0, 30);
//     res.json({ success: true, entries });
//   } catch (error) {
//     console.error('Load mood entries error:', error);
//     res.status(500).json({ error: 'Failed to load mood entries' });
//   }
// });

// app.post('/mood-entry', async (req, res) => {
//   try {
//     const { userId, mood, moodLabel, feeling } = req.body;
//     const moodValue = parseMoodValue(mood);
//     if (!userId || moodValue === null || moodValue < 1 || moodValue > 5) {
//       return res.status(400).json({ error: 'Missing or invalid mood data' });
//     }
//     const normalizedMoodLabel = normalizeMoodLabel(moodValue, moodLabel);
//     const docRef = await db.collection('mood_entries').add({
//       userId,
//       mood: moodValue,
//       moodLabel: normalizedMoodLabel,
//       feeling: feeling || '',
//       timestamp: admin.firestore.FieldValue.serverTimestamp(),
//       date: new Date().toLocaleDateString(),
//     });
//     res.json({ success: true, id: docRef.id });
//   } catch (error) {
//     console.error('Save mood entry error:', error);
//     res.status(500).json({ error: 'Failed to save mood entry' });
//   }
// });

// // Gemini chatbot endpoint
// app.post('/api/chat', async (req, res) => {
//   try {
//     const { message, userId } = req.body;
//     if (!message) {
//       return res.status(400).json({ error: 'Message is required' });
//     }

//     const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
//     const response = await model.generateContent(message);
//     const reply = response.response.text();

//     res.json({ reply, success: true });
//   } catch (error) {
//     console.error('Gemini API error:', error);
//     res
//       .status(500)
//       .json({ error: 'Failed to generate response', details: error.message });
//   }
// });

// app.options('/oauth/google-admin', cors());
// app.post('/oauth/google-admin', async (req, res) => {
//   try {
//     const { idToken } = req.body;
//     const payload = await verifyGoogleToken(idToken);
//     if (!isAdminGoogleEmail(payload.email)) {
//       return res.status(403).json({ error: 'Google account is not authorized for admin access' });
//     }
//     req.session.is_admin = true;
//     req.session.last_activity = Date.now();
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Admin Google OAuth error:', error);
//     res.status(400).json({ error: error.message || 'Google admin OAuth failed' });
//   }
// });

// // OAuth login for Apple/iCloud
// app.post('/oauth/apple', async (req, res) => {
//   try {
//     const { email, name, providerId } = req.body;
//     if (!email) {
//       return res.status(400).json({ error: 'Email is required for Apple login' });
//     }
//     const user = await createOrFindOauthUser('apple', providerId || email, email, name || email.split('@')[0]);
//     req.session.user = { id: user.id, email: user.email, name: getUserName(user) };
//     res.json({ success: true, user: req.session.user });
//   } catch (error) {
//     console.error('Apple OAuth error:', error);
//     res.status(500).json({ error: 'Apple login failed' });
//   }
// });

// // Admin login page
// app.get('/admin-login', (req, res) => {
//   res.redirect('/admin-login.html');
// });

// // Admin login
// app.post('/admin-login', (req, res) => {
//   const { username, password } = req.body;
//   // Simple check, in production use proper auth
//   if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
//     req.session.is_admin = true;
//     req.session.last_activity = Date.now();
//     res.redirect('/admin-dashboard');
//   } else {
//     res.redirect('/admin-login.html?error=1');
//   }
// });

// // Get admin settings
// app.get('/admin-settings', requireAdmin, (req, res) => {
//   const html = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Digital Mental Health Platform - Admin Settings</title>
//     <link rel="stylesheet" href="/admin-style.css">
// </head>
// <body>
//     <div class="admin-layout">
//         <aside class="sidebar">
//             <div class="brand">
//                 <h2>Digital Mental Health Platform</h2>
//                 <p>Settings</p>
//             </div>
//             <nav>
//                 <a href="/admin-dashboard">Dashboard</a>
//                 <a href="/admin-users">Users</a>
//                 <a href="/admin-analytics">Mood Analytics</a>
//                 <a class="active" href="/admin-settings">Settings</a>
//                 <a href="/admin-logout">Logout</a>
//             </nav>
//         </aside>

//         <main class="main-content">
//             <header class="page-header">
//                 <div>
//                     <h1>Settings</h1>
//                     <p class="page-meta">Configure platform settings and preferences.</p>
//                 </div>
//             </header>

//             <section>
//                 <form method="post" action="/admin-settings">
//                     <div class="form-group">
//                         <label for="siteTitle">Site Title</label>
//                         <input type="text" id="siteTitle" name="siteTitle" value="${adminSettings.siteTitle || 'Digital Mental Health Platform'}" required>
//                     </div>
//                     <div class="form-group">
//                         <label for="adminEmail">Admin Email</label>
//                         <input type="email" id="adminEmail" name="adminEmail" value="${adminSettings.adminEmail || 'admin@example.com'}" required>
//                     </div>
//                     <div class="form-group">
//                         <label for="sessionTimeout">Session Timeout (minutes)</label>
//                         <input type="number" id="sessionTimeout" name="sessionTimeout" value="${adminSettings.sessionTimeout || 30}" min="10" max="120" required>
//                     </div>
//                     <button type="submit" class="btn btn-primary">Save Settings</button>
//                 </form>
//             </section>
//         </main>
//     </div>
// </body>
// </html>`;
//   res.send(html);
// });

// // Update admin settings
// app.post('/admin-settings', requireAdmin, async (req, res) => {
//   try {
//     adminSettings = { ...adminSettings, ...req.body };
//     await saveAdminSettings();
//     res.redirect('/admin-settings');
//   } catch (err) {
//     console.error('Error updating settings:', err);
//     res.status(500).json({ error: 'Failed to save settings' });
//   }
// });

// // Get users
// app.get('/users', (req, res) => {
//   res.json(users);
// });

// // Subscribe to newsletter
// app.post('/subscribe', (req, res) => {
//   const { email } = req.body;
//   // Generate OTP
//   const otp = generateOTP();
//   otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 minutes

//   // Send OTP email
//   sendOTPEmail(email, otp);

//   res.json({ success: true, message: 'OTP sent to your email' });
// });

// // Verify OTP
// app.post('/verify-otp', (req, res) => {
//   const { email, otp } = req.body;
//   const stored = otpStore[email];
//   if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
//     return res.status(400).json({ error: 'Invalid or expired OTP' });
//   }
//   delete otpStore[email];
//   // Here, complete subscription or password reset
//   res.json({ success: true, message: 'Verified' });
// });

// // Password reset request
// app.post('/reset-password', (req, res) => {
//   const { email } = req.body;
//   const user = users.find(u => u.email === email);
//   if (!user) {
//     return res.status(404).json({ error: 'User not found' });
//   }
//   const otp = generateOTP();
//   otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
//   sendOTPEmail(email, otp);
//   res.json({ success: true, message: 'OTP sent' });
// });

// // Update password
// app.post('/update-password', async (req, res) => {
//   try {
//     const { email, newPassword } = req.body;
//     const user = users.find(u => u.email === email);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     user.password = newPassword;
//     await saveUsers();
//     res.json({ success: true });
//   } catch (err) {
//     console.error('Error updating password:', err);
//     res.status(500).json({ error: 'Failed to update password' });
//   }
// });

// // Admin dashboard
// app.get('/admin-dashboard', requireAdmin, async (req, res) => {
//   const totalUsers = users.length;
//   const allEntries = await getAllMoodEntries();
//   const totalMoodEntries = allEntries.length;
//   const todayStart = new Date();
//   todayStart.setHours(0, 0, 0, 0);
//   const activeUserIdsToday = new Set();
//   const moodDistribution = { 'Very Low': 0, 'Low': 0, 'Neutral': 0, 'Good': 0, 'Great': 0 };
//   let sumMoodScores = 0;
//   let subjectMoodCount = 0;

//   allEntries.forEach(entry => {
//     const mood = normalizeMoodLabel(entry.mood, entry.moodLabel);
//     moodDistribution[mood]++;
//     sumMoodScores += moodScore(entry.mood);
//     subjectMoodCount++;
//     const entryDate = parseMoodEntryDate(entry);
//     if (entryDate.toDateString() === todayStart.toDateString()) {
//       if (entry.userId) activeUserIdsToday.add(entry.userId);
//     }
//   });

//   const activeToday = activeUserIdsToday.size;

//   const avgMoodScore = subjectMoodCount > 0 ? (sumMoodScores / subjectMoodCount).toFixed(1) : 0;

//   const html = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Digital Mental Health Platform - Admin Dashboard</title>
//     <link rel="stylesheet" href="/admin-style.css">
// </head>
// <body>
//     <div class="admin-layout">
//         <aside class="sidebar">
//             <div class="brand">
//                 <h2>Digital Mental Health Platform</h2>
//                 <p>Admin Panel</p>
//             </div>
//             <nav>
//                 <a class="active" href="/admin-dashboard">Dashboard</a>
//                 <a href="/admin-users">Users</a>
//                 <a href="/admin-analytics">Mood Analytics</a>
//                 <a href="/admin-settings">Settings</a>
//                 <a href="/admin-logout">Logout</a>
//             </nav>
//         </aside>

//         <main class="main-content">
//             <header class="page-header">
//                 <div>
//                     <h1>Dashboard</h1>
//                     <p class="page-meta">Overview of platform usage and user activity.</p>
//                 </div>
//             </header>

//             <section class="stats-grid">
//                 <div class="card">
//                     <h2>Total Users</h2>
//                     <p class="stat-value">${totalUsers}</p>
//                     <p>Registered users on the platform.</p>
//                 </div>
//                 <div class="card">
//                     <h2>Total Mood Entries</h2>
//                     <p class="stat-value">${totalMoodEntries}</p>
//                     <p>Mood submissions across all users.</p>
//                 </div>
//                 <div class="card">
//                     <h2>Active Today</h2>
//                     <p class="stat-value">${activeToday}</p>
//                     <p>Users who logged mood data today.</p>
//                 </div>
//                 <div class="card">
//                     <h2>Average Mood Score</h2>
//                     <p class="stat-value">${avgMoodScore}</p>
//                     <p>Overall mood rating (1-5 scale).</p>
//                 </div>
//             </section>

//             <section class="chart-section">
//                 <h2>Mood Distribution</h2>
//                 <canvas id="moodChart" width="400" height="200"></canvas>
//             </section>
//         </main>
//     </div>

//     <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
//     <script>
//         const ctx = document.getElementById('moodChart').getContext('2d');
//         new Chart(ctx, {
//             type: 'bar',
//             data: {
//                 labels: ${JSON.stringify(Object.keys(moodDistribution))},
//                 datasets: [{
//                     label: 'Mood Count',
//                     data: ${JSON.stringify(Object.values(moodDistribution))},
//                     backgroundColor: 'rgba(59, 130, 246, 0.5)',
//                     borderColor: 'rgba(59, 130, 246, 1)',
//                     borderWidth: 1
//                 }]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                     legend: { display: false }
//                 },
//                 scales: {
//                     y: { beginAtZero: true }
//                 }
//             }
//         });
//     </script>
// </body>
// </html>`;
//   res.send(html);
// });

// // Admin analytics
// app.get('/admin-analytics', requireAdmin, async (req, res) => {
//   const moodDistribution = { 'Very Low': 0, 'Low': 0, 'Neutral': 0, 'Good': 0, 'Great': 0 };
//   const dailyCounts = {};
//   const periodStart = new Date();
//   periodStart.setDate(periodStart.getDate() - 29);
//   for (let i = 0; i < 30; i++) {
//     const date = new Date(periodStart);
//     date.setDate(date.getDate() + i);
//     const dateStr = date.toISOString().split('T')[0];
//     dailyCounts[dateStr] = 0;
//   }

//   let activeToday = 0;
//   let activeWeek = 0;
//   let activeMonth = 0;
//   const todayStart = new Date();
//   todayStart.setHours(0, 0, 0, 0);
//   const weekStart = new Date(todayStart);
//   weekStart.setDate(weekStart.getDate() - 6);
//   const monthStart = new Date(todayStart);
//   monthStart.setDate(monthStart.getDate() - 29);

//   const allEntries = await getAllMoodEntries();
//   allEntries.forEach(entry => {
//     const mood = normalizeMoodLabel(entry.mood, entry.moodLabel);
//     moodDistribution[mood]++;
//     const entryDate = parseMoodEntryDate(entry);
//     const dateStr = entryDate.toISOString().split('T')[0];
//     if (dailyCounts[dateStr] !== undefined) {
//       dailyCounts[dateStr]++;
//     }
//     if (entryDate >= todayStart) activeToday++;
//     if (entryDate >= weekStart) activeWeek++;
//     if (entryDate >= monthStart) activeMonth++;
//   });

//   if (req.query.export === 'csv') {
//     let csv = 'Metric,Value\n';
//     csv += `Active users today,${activeToday}\n`;
//     csv += `Active users last 7 days,${activeWeek}\n`;
//     csv += `Active users last 30 days,${activeMonth}\n`;
//     csv += '\nMood Category,Count\n';
//     Object.entries(moodDistribution).forEach(([label, count]) => {
//       csv += `${label},${count}\n`;
//     });
//     res.header('Content-Type', 'text/csv');
//     res.header('Content-Disposition', 'attachment; filename=analytics-report.csv');
//     res.send(csv);
//     return;
//   }

//   const chartLabels = Object.keys(dailyCounts).map(d => {
//     const date = new Date(d);
//     return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
//   });
//   const chartValues = Object.values(dailyCounts);

//   const html = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Digital Mental Health Platform - Mood Analytics</title>
//     <link rel="stylesheet" href="/admin-style.css">
//     <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
// </head>
// <body>
//     <div class="admin-layout">
//         <aside class="sidebar">
//             <div class="brand">
//                 <h2>Digital Mental Health Platform</h2>
//                 <p>Analytics</p>
//             </div>
//             <nav>
//                 <a href="/admin-dashboard">Dashboard</a>
//                 <a href="/admin-users">Users</a>
//                 <a class="active" href="/admin-analytics">Mood Analytics</a>
//                 <a href="/admin-settings">Settings</a>
//                 <a href="/admin-logout">Logout</a>
//             </nav>
//         </aside>

//         <main class="main-content">
//             <header class="page-header">
//                 <div>
//                     <h1>Mood Analytics</h1>
//                     <p class="page-meta">Track mood behavior, active participation, and export measurement reports.</p>
//                 </div>
//                 <div style="display:flex; gap:12px; flex-wrap:wrap;">
//                     <a class="btn btn-primary" href="/admin-analytics?export=csv">Export CSV</a>
//                 </div>
//             </header>

//             <section class="stats-grid">
//                 <div class="card">
//                     <h2>Active Today</h2>
//                     <p class="stat-value">${activeToday}</p>
//                     <p>Unique users who submitted mood data within the last 24 hours.</p>
//                 </div>
//                 <div class="card">
//                     <h2>Active Last 7 Days</h2>
//                     <p class="stat-value">${activeWeek}</p>
//                     <p>Users with recent engagement over one week.</p>
//                 </div>
//                 <div class="card">
//                     <h2>Active Last 30 Days</h2>
//                     <p class="stat-value">${activeMonth}</p>
//                     <p>Users with recent engagement over one month.</p>
//                 </div>
//             </section>

//             <section class="chart-section">
//                 <h2>Daily Mood Entries (Last 30 Days)</h2>
//                 <canvas id="dailyChart" width="400" height="200"></canvas>
//             </section>

//             <section class="chart-section">
//                 <h2>Mood Distribution</h2>
//                 <canvas id="moodChart" width="400" height="200"></canvas>
//             </section>
//         </main>
//     </div>

//     <script>
//         const dailyCtx = document.getElementById('dailyChart').getContext('2d');
//         new Chart(dailyCtx, {
//             type: 'line',
//             data: {
//                 labels: ${JSON.stringify(chartLabels)},
//                 datasets: [{
//                     label: 'Mood Entries',
//                     data: ${JSON.stringify(chartValues)},
//                     backgroundColor: 'rgba(59, 130, 246, 0.2)',
//                     borderColor: 'rgba(59, 130, 246, 1)',
//                     borderWidth: 2
//                 }]
//             },
//             options: {
//                 scales: {
//                     y: { beginAtZero: true }
//                 }
//             }
//         });

//         const moodCtx = document.getElementById('moodChart').getContext('2d');
//         new Chart(moodCtx, {
//             type: 'pie',
//             data: {
//                 labels: ${JSON.stringify(Object.keys(moodDistribution))},
//                 datasets: [{
//                     data: ${JSON.stringify(Object.values(moodDistribution))},
//                     backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#38bdf8']
//                 }]
//             },
//             options: {
//                 responsive: true,
//                 maintainAspectRatio: false,
//                 plugins: {
//                     legend: {
//                         position: 'bottom',
//                         labels: { color: '#f5f5f7' }
//                     }
//                 }
//             }
//         });
//     </script>
// </body>
// </html>`;
//   res.send(html);
// });

// // Admin users
// app.get('/admin-users', requireAdmin, async (req, res) => {
//   const rows = await Promise.all(users.map(async user => {
//     const entries = await getMoodEntriesForUser(user.id);
//     return `
//     <tr>
//       <td>${user.name}</td>
//       <td>${user.email}</td>
//       <td>${entries.length}</td>
//       <td>
//         <a class="btn btn-primary" href="/admin-users/view/${user.id}">View</a>
//         <form method="post" action="/admin-users/delete" style="display:inline;margin-left:8px;">
//           <input type="hidden" name="user_id" value="${user.id}">
//           <button type="submit" class="btn btn-danger">Delete</button>
//         </form>
//       </td>
//     </tr>`;
//   }));

//   const html = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Digital Mental Health Platform - Users</title>
//     <link rel="stylesheet" href="/admin-style.css">
// </head>
// <body>
//     <div class="admin-layout">
//         <aside class="sidebar">
//             <div class="brand">
//                 <h2>Digital Mental Health Platform</h2>
//                 <p>Users</p>
//             </div>
//             <nav>
//                 <a href="/admin-dashboard">Dashboard</a>
//                 <a class="active" href="/admin-users">Users</a>
//                 <a href="/admin-analytics">Mood Analytics</a>
//                 <a href="/admin-settings">Settings</a>
//                 <a href="/admin-logout">Logout</a>
//             </nav>
//         </aside>

//         <main class="main-content">
//             <header class="page-header">
//                 <div>
//                     <h1>Users</h1>
//                     <p class="page-meta">Manage registered users and their data.</p>
//                 </div>
//             </header>

//             <section>
//                 <table class="user-table">
//                     <thead>
//                         <tr>
//                             <th>Name</th>
//                             <th>Email</th>
//                             <th>Mood Entries</th>
//                             <th>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         ${rows.join('')}
//                     </tbody>
//                 </table>
//             </section>
//         </main>
//     </div>
// </body>
// </html>`;
//   res.send(html);
// });

// app.get('/admin-users/view/:id', requireAdmin, async (req, res) => {
//   const userId = req.params.id;
//   const user = users.find(u => u.id === userId);
//   if (!user) {
//     return res.redirect('/admin-users');
//   }

//   const entries = await getMoodEntriesForUser(userId);
//   const entryRows = entries.map(entry => `
//     <tr>
//       <td>${entry.date || ''}</td>
//       <td>${entry.mood || ''}</td>
//       <td>${entry.moodLabel || ''}</td>
//       <td>${entry.feeling || ''}</td>
//       <td>
//         <form method="post" action="/admin-users/${entry.id}/delete-entry" style="display:inline;">
//           <input type="hidden" name="user_id" value="${userId}">
//           <button type="submit" class="btn btn-danger">Delete</button>
//         </form>
//       </td>
//     </tr>`).join('');

//   const html = `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Admin User Details - ${user.name}</title>
//     <link rel="stylesheet" href="/admin-style.css">
// </head>
// <body>
//     <div class="admin-layout">
//         <aside class="sidebar">
//             <div class="brand">
//                 <h2>Digital Mental Health Platform</h2>
//                 <p>User Details</p>
//             </div>
//             <nav>
//                 <a href="/admin-dashboard">Dashboard</a>
//                 <a href="/admin-users">Users</a>
//                 <a href="/admin-analytics">Mood Analytics</a>
//                 <a href="/admin-settings">Settings</a>
//                 <a href="/admin-logout">Logout</a>
//             </nav>
//         </aside>

//         <main class="main-content">
//             <header class="page-header">
//                 <div>
//                     <h1>${user.name}</h1>
//                     <p class="page-meta">View and manage this user’s account and mood entries.</p>
//                 </div>
//             </header>

//             <section class="user-details">
//                 <h2>User Info</h2>
//                 <form method="post" action="/admin-users/update">
//                     <input type="hidden" name="user_id" value="${user.id}">
//                     <label>Name</label>
//                     <input type="text" name="name" value="${user.name || ''}" required>
//                     <label>Email</label>
//                     <input type="email" name="email" value="${user.email || ''}" required>
//                     <div style="margin-top:12px;">
//                         <button type="submit" class="btn btn-primary">Save</button>
//                         <a href="/admin-users" class="btn btn-secondary" style="margin-left:8px;">Back to users</a>
//                     </div>
//                 </form>
//             </section>

//             <section class="mood-entries-section">
//                 <h2>Mood Entries</h2>
//                 <form method="post" action="/admin-users/${user.id}/add-entry" style="margin-bottom:20px;">
//                     <input type="hidden" name="user_id" value="${user.id}">
//                     <div style="display:grid;grid-template-columns:1fr 1fr 1fr 2fr;gap:12px;align-items:end;">
//                         <div>
//                             <label>Date</label>
//                             <input type="date" name="date" value="${new Date().toISOString().slice(0,10)}" required>
//                         </div>
//                         <div>
//                             <label>Mood</label>
//                             <input type="text" name="mood" placeholder="Good" required>
//                         </div>
//                         <div>
//                             <label>Label</label>
//                             <input type="text" name="moodLabel" placeholder="Good" required>
//                         </div>
//                         <div>
//                             <label>Feeling</label>
//                             <input type="text" name="feeling" placeholder="How they felt" required>
//                         </div>
//                     </div>
//                     <button type="submit" class="btn btn-primary" style="margin-top:12px;">Add Mood Entry</button>
//                 </form>

//                 <table class="user-table">
//                     <thead>
//                         <tr>
//                             <th>Date</th>
//                             <th>Mood</th>
//                             <th>Label</th>
//                             <th>Feeling</th>
//                             <th>Actions</th>
//                         </tr>
//                     </thead>
//                     <tbody>
//                         ${entryRows || '<tr><td colspan="5">No mood entries yet.</td></tr>'}
//                     </tbody>
//                 </table>
//             </section>
//         </main>
//     </div>
// </body>
// </html>`;
//   res.send(html);
// });

// app.post('/admin-users/update', requireAdmin, async (req, res) => {
//   try {
//     const { user_id, name, email } = req.body;
//     const user = users.find(u => u.id === user_id);
//     if (user) {
//       user.name = name || user.name;
//       user.email = email || user.email;
//       await saveUsers();
//     }
//     res.redirect(`/admin-users/view/${user_id}`);
//   } catch (err) {
//     console.error('Error updating user:', err);
//     res.status(500).json({ error: 'Failed to update user' });
//   }
// });

// app.post('/admin-users/:userId/add-entry', requireAdmin, async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const { mood, moodLabel, feeling, date } = req.body;
//     if (!userId || !mood || !moodLabel) {
//       return res.status(400).json({ error: 'Missing entry data' });
//     }
//     await db.collection('mood_entries').add({
//       userId,
//       mood,
//       moodLabel,
//       feeling: feeling || '',
//       timestamp: date ? admin.firestore.Timestamp.fromDate(new Date(date)) : admin.firestore.FieldValue.serverTimestamp(),
//       date: date || new Date().toLocaleDateString()
//     });
//     res.redirect(`/admin-users/view/${userId}`);
//   } catch (err) {
//     console.error('Error adding mood entry:', err);
//     res.status(500).json({ error: 'Failed to add mood entry' });
//   }
// });

// app.post('/admin-users/:userId/delete-entry', requireAdmin, async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const { user_id, entry_id } = req.body;
//     if (!entry_id) {
//       return res.status(400).json({ error: 'Missing entry id' });
//     }
//     await deleteMoodEntryById(entry_id);
//     res.redirect(`/admin-users/view/${userId}`);
//   } catch (err) {
//     console.error('Error deleting mood entry:', err);
//     res.status(500).json({ error: 'Failed to delete mood entry' });
//   }
// });

// app.post('/admin-users/delete', requireAdmin, async (req, res) => {
//   try {
//     const { user_id } = req.body;
//     const index = users.findIndex(u => u.id === user_id);
//     if (index !== -1) {
//       users.splice(index, 1);
//       await saveUsers();
//       const entries = await getMoodEntriesForUser(user_id);
//       for (const entry of entries) {
//         await deleteMoodEntryById(entry.id);
//       }
//     }
//     res.redirect('/admin-users');
//   } catch (err) {
//     console.error('Error deleting user:', err);
//     res.status(500).json({ error: 'Failed to delete user' });
//   }
// });

// // Admin logout
// app.get('/admin-logout', (req, res) => {
//   req.session.destroy();
//   res.redirect('/admin-login.html');
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import session from 'express-session';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { admin, db } from './firebase-admin-config.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';

// Create __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'admin123';
const ADMIN_GOOGLE_EMAILS = process.env.ADMIN_GOOGLE_EMAIL
  ? process.env.ADMIN_GOOGLE_EMAIL.split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
  : [];
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts, please try again later' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many registration attempts, please try again later' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many requests, please slow down' },
});

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL || 'https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  })
);
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 60 * 1000, // 30 minutes
      sameSite: 'lax',
    },
  })
);

// Serve static files
app.use(express.static(path.join(__dirname)));

// Validation functions
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

function validatePassword(password) {
  return password && password.length >= 6;
}

function validateMoodValue(mood) {
  const value = parseMoodValue(mood);
  return value !== null && value >= 1 && value <= 5;
}

// Root route - serve the main application
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'HTML', 'MainPage.html'));
});

// Middleware to check admin auth
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

// Email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// In-memory storage with cleanup
let users = [];
let adminSettings = {};
let otpStore = new Map(); // Use Map for better performance

// Clean up expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expires) {
      otpStore.delete(email);
    }
  }
}, 60000);

// Initialize data from Firestore on startup
async function initializeData() {
  try {
    const usersSnapshot = await db.collection('users').get();
    users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`Loaded ${users.length} users from Firestore`);
  } catch (err) {
    console.error('Error loading users from Firestore:', err);
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
    console.error('Error loading admin settings from Firestore:', err);
  }
}

// Initialize data
initializeData();

// Helper functions
function parseMoodValue(mood) {
  if (typeof mood === 'number' && Number.isFinite(mood)) {
    return mood;
  }
  if (typeof mood === 'string') {
    const trimmed = mood.trim();
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
      return numeric;
    }
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

  if (fallbackLabel && typeof fallbackLabel === 'string') {
    return normalizeMoodLabel(fallbackLabel);
  }
  return 'Neutral';
}

function generateUserId() {
  return `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

// Save users to Firestore with batch optimization
async function saveUsers() {
  try {
    const batches = [];
    let currentBatch = db.batch();
    let batchCount = 0;

    for (const user of users) {
      const userRef = db.collection('users').doc(user.id);
      currentBatch.set(userRef, user, { merge: true });
      batchCount++;

      if (batchCount >= 500) {
        batches.push(currentBatch.commit());
        currentBatch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      batches.push(currentBatch.commit());
    }

    await Promise.all(batches);
    console.log('Users saved to Firestore');
  } catch (err) {
    console.error('Error saving users to Firestore:', err);
    throw err;
  }
}

// Save admin settings to Firestore
async function saveAdminSettings() {
  try {
    await db
      .collection('admin_settings')
      .doc('config')
      .set(adminSettings, { merge: true });
    console.log('Admin settings saved to Firestore');
  } catch (err) {
    console.error('Error saving admin settings to Firestore:', err);
    throw err;
  }
}

function parseMoodEntryDate(entry) {
  if (entry.timestamp) {
    if (entry.timestamp.toDate) {
      return entry.timestamp.toDate();
    }
    const parsed = new Date(entry.timestamp);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  if (entry.date) {
    const parsedDate = new Date(entry.date);
    if (!Number.isNaN(parsedDate.getTime())) return parsedDate;
  }
  if (entry.createdAt) {
    const parsedCreated = entry.createdAt.toDate
      ? entry.createdAt.toDate()
      : new Date(entry.createdAt);
    if (!Number.isNaN(parsedCreated.getTime())) return parsedCreated;
  }
  return new Date(0);
}

async function getMoodEntriesForUser(userId) {
  if (!userId) return [];
  try {
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
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    return [];
  }
}

async function getAllMoodEntries() {
  try {
    const snapshot = await db.collection('mood_entries').get();
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort(
        (a, b) =>
          parseMoodEntryDate(b).getTime() - parseMoodEntryDate(a).getTime()
      );
  } catch (error) {
    console.error('Error fetching all mood entries:', error);
    return [];
  }
}

async function deleteMoodEntryById(entryId) {
  if (!entryId) return;
  try {
    await db.collection('mood_entries').doc(String(entryId)).delete();
  } catch (error) {
    console.error('Error deleting mood entry:', error);
    throw error;
  }
}

// Generate OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Send OTP email
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
    throw error;
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
  const id = generateUserId();
  user = {
    id,
    email: email.toLowerCase(),
    password: await bcrypt.hash(`${provider}_oauth_${providerId}`, 10),
    provider,
    providerId,
    name: name || getUserName({ email }),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  await saveUsers();
  return user;
}

async function verifyGoogleToken(idToken) {
  if (!idToken) throw new Error('Missing Google ID token');
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new Error('Google Client ID not configured');
  }
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Invalid Google token');
  const payload = await response.json();
  if (googleClientId && payload.aud !== googleClientId) {
    throw new Error('Token audience does not match Google client ID');
  }
  return payload;
}

// Routes with rate limiting

// Register user
app.post('/register', registerLimiter, async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' });
    }

    const displayName = name || username || email.split('@')[0];
    const existingUser = findUserByEmail(email);

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: generateUserId(),
      name: displayName,
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsers();

    res.json({ success: true, message: 'Registration successful' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Local login
app.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      name: getUserName(user),
    };

    res.json({ success: true, user: req.session.user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Check session endpoint
app.get('/check-session', (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false });
  }
});

function isAdminGoogleEmail(email) {
  if (!email) return false;
  if (ADMIN_GOOGLE_EMAILS.length === 0) return true;
  return ADMIN_GOOGLE_EMAILS.includes(String(email).toLowerCase());
}

// OAuth login for Google
app.options('/oauth/google', cors());
app.post('/oauth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

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

// Get mood entries for a user
app.get('/mood-entries', async (req, res) => {
  try {
    const userId = String(req.query.userId || '').trim();
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const snapshot = await db
      .collection('mood_entries')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
    }));

    res.json({ success: true, entries });
  } catch (error) {
    console.error('Load mood entries error:', error);
    res.status(500).json({ error: 'Failed to load mood entries' });
  }
});

// Save mood entry
app.post('/mood-entry', apiLimiter, async (req, res) => {
  try {
    const { userId, mood, moodLabel, feeling } = req.body;
    const moodValue = parseMoodValue(mood);

    if (!userId || !validateMoodValue(mood)) {
      return res.status(400).json({ error: 'Missing or invalid mood data' });
    }

    const normalizedMoodLabel = normalizeMoodLabel(moodValue, moodLabel);
    const docRef = await db.collection('mood_entries').add({
      userId: String(userId),
      mood: moodValue,
      moodLabel: normalizedMoodLabel,
      feeling: feeling || '',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      date: new Date().toISOString().split('T')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Save mood entry error:', error);
    res.status(500).json({ error: 'Failed to save mood entry' });
  }
});

// Gemini chatbot endpoint
app.post('/api/chat', apiLimiter, async (req, res) => {
  try {
    const { message, userId } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Valid message is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const response = await model.generateContent(message);
    const reply = response.response.text();

    res.json({ reply, success: true });
  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({
      error: 'Failed to generate response',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Admin Google OAuth
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

// OAuth login for Apple/iCloud
app.post('/oauth/apple', async (req, res) => {
  try {
    const { email, name, providerId } = req.body;
    if (!email || !validateEmail(email)) {
      return res
        .status(400)
        .json({ error: 'Valid email is required for Apple login' });
    }

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

// Admin login page
app.get('/admin-login', (req, res) => {
  res.redirect('/admin-login.html');
});

// Admin login
app.post('/admin-login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.is_admin = true;
    req.session.last_activity = Date.now();
    res.redirect('/admin-dashboard');
  } else {
    res.redirect('/admin-login.html?error=1');
  }
});

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Get admin settings
app.get('/admin-settings', requireAdmin, (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Mental Health Platform - Admin Settings</title>
    <link rel="stylesheet" href="/admin-style.css">
</head>
<body>
    <div class="admin-layout">
        <aside class="sidebar">
            <div class="brand">
                <h2>Digital Mental Health Platform</h2>
                <p>Settings</p>
            </div>
            <nav>
                <a href="/admin-dashboard">Dashboard</a>
                <a href="/admin-users">Users</a>
                <a href="/admin-analytics">Mood Analytics</a>
                <a class="active" href="/admin-settings">Settings</a>
                <a href="/admin-logout">Logout</a>
            </nav>
        </aside>

        <main class="main-content">
            <header class="page-header">
                <div>
                    <h1>Settings</h1>
                    <p class="page-meta">Configure platform settings and preferences.</p>
                </div>
            </header>

            <section>
                <form method="post" action="/admin-settings">
                    <div class="form-group">
                        <label for="siteTitle">Site Title</label>
                        <input type="text" id="siteTitle" name="siteTitle" value="${escapeHtml(adminSettings.siteTitle || 'Digital Mental Health Platform')}" required>
                    </div>
                    <div class="form-group">
                        <label for="adminEmail">Admin Email</label>
                        <input type="email" id="adminEmail" name="adminEmail" value="${escapeHtml(adminSettings.adminEmail || 'admin@example.com')}" required>
                    </div>
                    <div class="form-group">
                        <label for="sessionTimeout">Session Timeout (minutes)</label>
                        <input type="number" id="sessionTimeout" name="sessionTimeout" value="${adminSettings.sessionTimeout || 30}" min="10" max="120" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Save Settings</button>
                </form>
            </section>
        </main>
    </div>
</body>
</html>`;
  res.send(html);
});

// Update admin settings
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

// Get users
app.get('/users', (req, res) => {
  const safeUsers = users.map(({ password, ...user }) => user);
  res.json(safeUsers);
});

// Subscribe to newsletter
app.post('/subscribe', apiLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const otp = generateOTP();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });

    await sendOTPEmail(email, otp);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP
app.post('/verify-otp', apiLimiter, (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore.get(email);

  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  otpStore.delete(email);
  res.json({ success: true, message: 'Verified' });
});

// Password reset request
app.post('/reset-password', apiLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists, an OTP has been sent',
      });
    }

    const otp = generateOTP();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });
    await sendOTPEmail(email, otp);

    res.json({
      success: true,
      message: 'If the email exists, an OTP has been sent',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Update password
app.post('/update-password', apiLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res
        .status(400)
        .json({ error: 'Email, OTP, and new password are required' });
    }

    if (!validatePassword(newPassword)) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 6 characters' });
    }

    const stored = otpStore.get(email);
    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await saveUsers();
    otpStore.delete(email);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Admin dashboard
app.get('/admin-dashboard', requireAdmin, async (req, res) => {
  try {
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
    let sumMoodScores = 0;
    let subjectMoodCount = 0;

    allEntries.forEach((entry) => {
      const mood = normalizeMoodLabel(entry.mood, entry.moodLabel);
      moodDistribution[mood]++;
      sumMoodScores += moodScore(entry.mood);
      subjectMoodCount++;
      const entryDate = parseMoodEntryDate(entry);
      if (entryDate.toDateString() === todayStart.toDateString()) {
        if (entry.userId) activeUserIdsToday.add(entry.userId);
      }
    });

    const activeToday = activeUserIdsToday.size;
    const avgMoodScore =
      subjectMoodCount > 0 ? (sumMoodScores / subjectMoodCount).toFixed(1) : 0;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Mental Health Platform - Admin Dashboard</title>
    <link rel="stylesheet" href="/admin-style.css">
</head>
<body>
    <div class="admin-layout">
        <aside class="sidebar">
            <div class="brand">
                <h2>Digital Mental Health Platform</h2>
                <p>Admin Panel</p>
            </div>
            <nav>
                <a class="active" href="/admin-dashboard">Dashboard</a>
                <a href="/admin-users">Users</a>
                <a href="/admin-analytics">Mood Analytics</a>
                <a href="/admin-settings">Settings</a>
                <a href="/admin-logout">Logout</a>
            </nav>
        </aside>

        <main class="main-content">
            <header class="page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p class="page-meta">Overview of platform usage and user activity.</p>
                </div>
            </header>

            <section class="stats-grid">
                <div class="card">
                    <h2>Total Users</h2>
                    <p class="stat-value">${totalUsers}</p>
                    <p>Registered users on the platform.</p>
                </div>
                <div class="card">
                    <h2>Total Mood Entries</h2>
                    <p class="stat-value">${totalMoodEntries}</p>
                    <p>Mood submissions across all users.</p>
                </div>
                <div class="card">
                    <h2>Active Today</h2>
                    <p class="stat-value">${activeToday}</p>
                    <p>Users who logged mood data today.</p>
                </div>
                <div class="card">
                    <h2>Average Mood Score</h2>
                    <p class="stat-value">${avgMoodScore}</p>
                    <p>Overall mood rating (1-5 scale).</p>
                </div>
            </section>

            <section class="chart-section">
                <h2>Mood Distribution</h2>
                <canvas id="moodChart" width="400" height="200"></canvas>
            </section>
        </main>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
        const ctx = document.getElementById('moodChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ${JSON.stringify(Object.keys(moodDistribution))},
                datasets: [{
                    label: 'Mood Count',
                    data: ${JSON.stringify(Object.values(moodDistribution))},
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, integer: true }
                }
            }
        });
    </script>
</body>
</html>`;
    res.send(html);
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Admin analytics
app.get('/admin-analytics', requireAdmin, async (req, res) => {
  try {
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
      const dateStr = date.toISOString().split('T')[0];
      dailyCounts[dateStr] = 0;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 29);

    const allEntries = await getAllMoodEntries();
    const uniqueUsersByPeriod = {
      day: new Set(),
      week: new Set(),
      month: new Set(),
    };

    allEntries.forEach((entry) => {
      const mood = normalizeMoodLabel(entry.mood, entry.moodLabel);
      moodDistribution[mood]++;
      const entryDate = parseMoodEntryDate(entry);
      const dateStr = entryDate.toISOString().split('T')[0];
      if (dailyCounts[dateStr] !== undefined) {
        dailyCounts[dateStr]++;
      }

      if (entryDate >= todayStart && entry.userId)
        uniqueUsersByPeriod.day.add(entry.userId);
      if (entryDate >= weekStart && entry.userId)
        uniqueUsersByPeriod.week.add(entry.userId);
      if (entryDate >= monthStart && entry.userId)
        uniqueUsersByPeriod.month.add(entry.userId);
    });

    const activeToday = uniqueUsersByPeriod.day.size;
    const activeWeek = uniqueUsersByPeriod.week.size;
    const activeMonth = uniqueUsersByPeriod.month.size;

    if (req.query.export === 'csv') {
      let csv = 'Metric,Value\n';
      csv += `Active users today,${activeToday}\n`;
      csv += `Active users last 7 days,${activeWeek}\n`;
      csv += `Active users last 30 days,${activeMonth}\n`;
      csv += '\nMood Category,Count\n';
      Object.entries(moodDistribution).forEach(([label, count]) => {
        csv += `${label},${count}\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename=analytics-report.csv'
      );
      res.send(csv);
      return;
    }

    const chartLabels = Object.keys(dailyCounts).map((d) => {
      const date = new Date(d);
      return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    });
    const chartValues = Object.values(dailyCounts);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Mental Health Platform - Mood Analytics</title>
    <link rel="stylesheet" href="/admin-style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="admin-layout">
        <aside class="sidebar">
            <div class="brand">
                <h2>Digital Mental Health Platform</h2>
                <p>Analytics</p>
            </div>
            <nav>
                <a href="/admin-dashboard">Dashboard</a>
                <a href="/admin-users">Users</a>
                <a class="active" href="/admin-analytics">Mood Analytics</a>
                <a href="/admin-settings">Settings</a>
                <a href="/admin-logout">Logout</a>
            </nav>
        </aside>

        <main class="main-content">
            <header class="page-header">
                <div>
                    <h1>Mood Analytics</h1>
                    <p class="page-meta">Track mood behavior, active participation, and export measurement reports.</p>
                </div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <a class="btn btn-primary" href="/admin-analytics?export=csv">Export CSV</a>
                </div>
            </header>

            <section class="stats-grid">
                <div class="card">
                    <h2>Active Today</h2>
                    <p class="stat-value">${activeToday}</p>
                    <p>Unique users who submitted mood data within the last 24 hours.</p>
                </div>
                <div class="card">
                    <h2>Active Last 7 Days</h2>
                    <p class="stat-value">${activeWeek}</p>
                    <p>Users with recent engagement over one week.</p>
                </div>
                <div class="card">
                    <h2>Active Last 30 Days</h2>
                    <p class="stat-value">${activeMonth}</p>
                    <p>Users with recent engagement over one month.</p>
                </div>
            </section>

            <section class="chart-section">
                <h2>Daily Mood Entries (Last 30 Days)</h2>
                <canvas id="dailyChart" width="400" height="200"></canvas>
            </section>

            <section class="chart-section">
                <h2>Mood Distribution</h2>
                <canvas id="moodChart" width="400" height="200"></canvas>
            </section>
        </main>
    </div>

    <script>
        const dailyCtx = document.getElementById('dailyChart').getContext('2d');
        new Chart(dailyCtx, {
            type: 'line',
            data: {
                labels: ${JSON.stringify(chartLabels)},
                datasets: [{
                    label: 'Mood Entries',
                    data: ${JSON.stringify(chartValues)},
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, integer: true }
                }
            }
        });

        const moodCtx = document.getElementById('moodChart').getContext('2d');
        new Chart(moodCtx, {
            type: 'pie',
            data: {
                labels: ${JSON.stringify(Object.keys(moodDistribution))},
                datasets: [{
                    data: ${JSON.stringify(Object.values(moodDistribution))},
                    backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#38bdf8']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#f5f5f7' }
                    }
                }
            }
        });
    </script>
</body>
</html>`;
    res.send(html);
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).send('Error loading analytics');
  }
});

// Admin users
app.get('/admin-users', requireAdmin, async (req, res) => {
  try {
    const rows = await Promise.all(
      users.map(async (user) => {
        const entries = await getMoodEntriesForUser(user.id);
        return `
        <tr>
          <td>${escapeHtml(user.name || '')}</td>
          <td>${escapeHtml(user.email || '')}</td>
          <td>${entries.length}</td>
          <td>
            <a class="btn btn-primary" href="/admin-users/view/${user.id}">View</a>
            <form method="post" action="/admin-users/delete" style="display:inline;margin-left:8px;">
              <input type="hidden" name="user_id" value="${user.id}">
              <button type="submit" class="btn btn-danger" onclick="return confirm('Are you sure you want to delete this user?')">Delete</button>
            </form>
          </td>
        </tr>`;
      })
    );

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Mental Health Platform - Users</title>
    <link rel="stylesheet" href="/admin-style.css">
</head>
<body>
    <div class="admin-layout">
        <aside class="sidebar">
            <div class="brand">
                <h2>Digital Mental Health Platform</h2>
                <p>Users</p>
            </div>
            <nav>
                <a href="/admin-dashboard">Dashboard</a>
                <a class="active" href="/admin-users">Users</a>
                <a href="/admin-analytics">Mood Analytics</a>
                <a href="/admin-settings">Settings</a>
                <a href="/admin-logout">Logout</a>
            </nav>
        </aside>

        <main class="main-content">
            <header class="page-header">
                <div>
                    <h1>Users</h1>
                    <p class="page-meta">Manage registered users and their data.</p>
                </div>
            </header>

            <section>
                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Mood Entries</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.join('')}
                    </tbody>
                </table>
            </section>
        </main>
    </div>
</body>
</html>`;
    res.send(html);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).send('Error loading users');
  }
});

// Admin view single user
app.get('/admin-users/view/:id', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.redirect('/admin-users');
    }

    const entries = await getMoodEntriesForUser(userId);
    const entryRows = entries
      .map(
        (entry) => `
      <tr>
        <td>${escapeHtml(entry.date || '')}</td>
        <td>${escapeHtml(String(entry.mood || ''))}</td>
        <td>${escapeHtml(entry.moodLabel || '')}</td>
        <td>${escapeHtml(entry.feeling || '')}</td>
        <td>
          <form method="post" action="/admin-users/${entry.id}/delete-entry" style="display:inline;" onsubmit="return confirm('Are you sure?')">
            <input type="hidden" name="user_id" value="${userId}">
            <input type="hidden" name="entry_id" value="${entry.id}">
            <button type="submit" class="btn btn-danger">Delete</button>
          </form>
        </td>
      </tr>`
      )
      .join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin User Details - ${escapeHtml(user.name)}</title>
    <link rel="stylesheet" href="/admin-style.css">
</head>
<body>
    <div class="admin-layout">
        <aside class="sidebar">
            <div class="brand">
                <h2>Digital Mental Health Platform</h2>
                <p>User Details</p>
            </div>
            <nav>
                <a href="/admin-dashboard">Dashboard</a>
                <a href="/admin-users">Users</a>
                <a href="/admin-analytics">Mood Analytics</a>
                <a href="/admin-settings">Settings</a>
                <a href="/admin-logout">Logout</a>
            </nav>
        </aside>

        <main class="main-content">
            <header class="page-header">
                <div>
                    <h1>${escapeHtml(user.name)}</h1>
                    <p class="page-meta">View and manage this user's account and mood entries.</p>
                </div>
            </header>

            <section class="user-details">
                <h2>User Info</h2>
                <form method="post" action="/admin-users/update">
                    <input type="hidden" name="user_id" value="${user.id}">
                    <label>Name</label>
                    <input type="text" name="name" value="${escapeHtml(user.name || '')}" required>
                    <label>Email</label>
                    <input type="email" name="email" value="${escapeHtml(user.email || '')}" required>
                    <div style="margin-top:12px;">
                        <button type="submit" class="btn btn-primary">Save</button>
                        <a href="/admin-users" class="btn btn-secondary" style="margin-left:8px;">Back to users</a>
                    </div>
                </form>
            </section>

            <section class="mood-entries-section">
                <h2>Mood Entries</h2>
                <form method="post" action="/admin-users/${user.id}/add-entry" style="margin-bottom:20px;">
                    <input type="hidden" name="user_id" value="${user.id}">
                    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 2fr;gap:12px;align-items:end;">
                        <div>
                            <label>Date</label>
                            <input type="date" name="date" value="${new Date().toISOString().slice(0, 10)}" required>
                        </div>
                        <div>
                            <label>Mood (1-5)</label>
                            <input type="number" name="mood" placeholder="3" min="1" max="5" required>
                        </div>
                        <div>
                            <label>Label</label>
                            <input type="text" name="moodLabel" placeholder="Neutral" required>
                        </div>
                        <div>
                            <label>Feeling</label>
                            <input type="text" name="feeling" placeholder="How they felt" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="margin-top:12px;">Add Mood Entry</button>
                </form>

                <table class="user-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Mood</th>
                            <th>Label</th>
                            <th>Feeling</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${entryRows || '<tr><td colspan="5">No mood entries yet.</td></tr>'}
                    </tbody>
                </table>
            </section>
        </main>
    </div>
</body>
</html>`;
    res.send(html);
  } catch (error) {
    console.error('Admin view user error:', error);
    res.status(500).send('Error loading user details');
  }
});

// Admin update user
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

// Admin add mood entry
app.post('/admin-users/:userId/add-entry', requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { mood, moodLabel, feeling, date } = req.body;
    if (!userId || !mood || !moodLabel) {
      return res.status(400).json({ error: 'Missing entry data' });
    }
    await db.collection('mood_entries').add({
      userId: String(userId),
      mood: parseInt(mood),
      moodLabel,
      feeling: feeling || '',
      timestamp: date
        ? admin.firestore.Timestamp.fromDate(new Date(date))
        : admin.firestore.FieldValue.serverTimestamp(),
      date: date || new Date().toISOString().split('T')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.redirect(`/admin-users/view/${userId}`);
  } catch (err) {
    console.error('Error adding mood entry:', err);
    res.status(500).json({ error: 'Failed to add mood entry' });
  }
});

// Admin delete mood entry
app.post(
  '/admin-users/:entryId/delete-entry',
  requireAdmin,
  async (req, res) => {
    try {
      const { user_id, entry_id } = req.body;
      if (!entry_id) {
        return res.status(400).json({ error: 'Missing entry id' });
      }
      await deleteMoodEntryById(entry_id);
      res.redirect(`/admin-users/view/${user_id}`);
    } catch (err) {
      console.error('Error deleting mood entry:', err);
      res.status(500).json({ error: 'Failed to delete mood entry' });
    }
  }
);

// Admin delete user
app.post('/admin-users/delete', requireAdmin, async (req, res) => {
  try {
    const { user_id } = req.body;
    const index = users.findIndex((u) => u.id === user_id);
    if (index !== -1) {
      users.splice(index, 1);
      await saveUsers();
      const entries = await getMoodEntriesForUser(user_id);
      for (const entry of entries) {
        await deleteMoodEntryById(entry.id);
      }
    }
    res.redirect('/admin-users');
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin logout
app.get('/admin-logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/admin-login.html');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});