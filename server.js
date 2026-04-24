const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const ADMIN_USERNAME = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASS || 'admin123';
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your-secret-key', // Change this to a secure key
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Middleware to check admin auth
function requireAdmin(req, res, next) {
  const sessionTimeout = 1800 * 1000; // 30 minutes
  if (!req.session.is_admin || (Date.now() - req.session.last_activity) > sessionTimeout) {
    return res.redirect('/admin-login.html?error=expired');
  }
  req.session.last_activity = Date.now();
  next();
}

// Email transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// In-memory storage for simplicity (use database in production)
let users = [];
let adminSettings = {};
let otpStore = {}; // Store OTPs temporarily

// Load data from files
try {
  if (fs.existsSync('users.json')) {
    users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  }
} catch (err) {
  console.log('Error loading users.json:', err);
}

try {
  if (fs.existsSync('admin-settings.json')) {
    adminSettings = JSON.parse(fs.readFileSync('admin-settings.json', 'utf8'));
  }
} catch (err) {
  console.log('Error loading admin-settings.json:', err);
}

// Helper functions
function moodScore(mood) {
  const m = mood.toLowerCase().trim();
  if (m === 'very low') return 1;
  if (m === 'low') return 2;
  if (m === 'neutral') return 3;
  if (m === 'good') return 4;
  if (m === 'great' || m === 'excellent') return 5;
  return 3;
}

function normalizeMoodLabel(mood) {
  const m = mood.toLowerCase().trim();
  if (m === 'very low') return 'Very Low';
  if (m === 'low') return 'Low';
  if (m === 'neutral') return 'Neutral';
  if (m === 'good') return 'Good';
  if (m === 'great' || m === 'excellent') return 'Great';
  return 'Neutral';
}

// Save users
function saveUsers() {
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
}

// Save admin settings
function saveAdminSettings() {
  fs.writeFileSync('admin-settings.json', JSON.stringify(adminSettings, null, 2));
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
    text: `Your OTP code is: ${otp}. It expires in 10 minutes.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent to:', email);
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
}

// Routes

// Register user
app.post('/register', (req, res) => {
  const { id, name, email, password } = req.body;
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: 'User already exists' });
  }
  users.push({ id, name, email, password });
  saveUsers();
  res.json({ success: true });
});

// Admin login page
app.get('/admin-login', (req, res) => {
  res.redirect('/admin-login.html');
});

// Admin login
app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  // Simple check, in production use proper auth
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.is_admin = true;
    req.session.last_activity = Date.now();
    res.redirect('/admin-dashboard');
  } else {
    res.redirect('/admin-login.html?error=1');
  }
});

// Get admin settings
app.get('/admin-settings', requireAdmin, (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Mental Health Platform - Admin Settings</title>
    <link rel="stylesheet" href="admin-style.css">
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
                        <input type="text" id="siteTitle" name="siteTitle" value="${adminSettings.siteTitle || 'Digital Mental Health Platform'}" required>
                    </div>
                    <div class="form-group">
                        <label for="adminEmail">Admin Email</label>
                        <input type="email" id="adminEmail" name="adminEmail" value="${adminSettings.adminEmail || 'admin@example.com'}" required>
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
app.post('/admin-settings', requireAdmin, (req, res) => {
  adminSettings = { ...adminSettings, ...req.body };
  saveAdminSettings();
  res.redirect('/admin-settings');
});

// Get users
app.get('/users', (req, res) => {
  res.json(users);
});

// Subscribe to newsletter
app.post('/subscribe', (req, res) => {
  const { email } = req.body;
  // Generate OTP
  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 minutes

  // Send OTP email
  sendOTPEmail(email, otp);

  res.json({ success: true, message: 'OTP sent to your email' });
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore[email];
  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  delete otpStore[email];
  // Here, complete subscription or password reset
  res.json({ success: true, message: 'Verified' });
});

// Password reset request
app.post('/reset-password', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const otp = generateOTP();
  otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 };
  sendOTPEmail(email, otp);
  res.json({ success: true, message: 'OTP sent' });
});

// Update password
app.post('/update-password', (req, res) => {
  const { email, newPassword } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  user.password = newPassword;
  saveUsers();
  res.json({ success: true });
});

// Admin dashboard
app.get('/admin-dashboard', requireAdmin, (req, res) => {
  const totalUsers = users.length;
  const totalMoodEntries = users.reduce((sum, user) => sum + (user.moodEntries ? user.moodEntries.length : 0), 0);
  const activeToday = users.filter(user => {
    if (!user.moodEntries) return false;
    return user.moodEntries.some(entry => {
      const entryDate = new Date(entry.timestamp);
      const today = new Date();
      return entryDate.toDateString() === today.toDateString();
    });
  }).length;

  const moodDistribution = { 'Very Low': 0, 'Low': 0, 'Neutral': 0, 'Good': 0, 'Great': 0 };
  let sumMoodScores = 0;
  let subjectMoodCount = 0;

  users.forEach(user => {
    if (user.moodEntries) {
      user.moodEntries.forEach(entry => {
        const mood = normalizeMoodLabel(entry.mood);
        moodDistribution[mood]++;
        sumMoodScores += moodScore(entry.mood);
        subjectMoodCount++;
      });
    }
  });

  const avgMoodScore = subjectMoodCount > 0 ? (sumMoodScores / subjectMoodCount).toFixed(1) : 0;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Mental Health Platform - Admin Dashboard</title>
    <link rel="stylesheet" href="admin-style.css">
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
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    </script>
</body>
</html>`;
  res.send(html);
});

// Admin analytics
app.get('/admin-analytics', requireAdmin, (req, res) => {
  const moodDistribution = { 'Very Low': 0, 'Low': 0, 'Neutral': 0, 'Good': 0, 'Great': 0 };
  const dailyCounts = {};
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - 29);
  for (let i = 0; i < 30; i++) {
    const date = new Date(periodStart);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dailyCounts[dateStr] = 0;
  }

  let activeToday = 0;
  let activeWeek = 0;
  let activeMonth = 0;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(todayStart);
  monthStart.setDate(monthStart.getDate() - 29);

  users.forEach(user => {
    if (user.moodEntries) {
      user.moodEntries.forEach(entry => {
        const mood = normalizeMoodLabel(entry.mood);
        moodDistribution[mood]++;
        const entryDate = new Date(entry.timestamp);
        const dateStr = entryDate.toISOString().split('T')[0];
        if (dailyCounts[dateStr] !== undefined) {
          dailyCounts[dateStr]++;
        }
        if (entryDate >= todayStart) activeToday++;
        if (entryDate >= weekStart) activeWeek++;
        if (entryDate >= monthStart) activeMonth++;
      });
    }
  });

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
    res.header('Content-Disposition', 'attachment; filename=analytics-report.csv');
    res.send(csv);
    return;
  }

  const chartLabels = Object.keys(dailyCounts).map(d => {
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
    <link rel="stylesheet" href="admin-style.css">
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
                    borderWidth: 2
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true }
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
            }
        });
    </script>
</body>
</html>`;
  res.send(html);
});

// Admin users
app.get('/admin-users', requireAdmin, (req, res) => {
  const userRows = users.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.moodEntries ? user.moodEntries.length : 0}</td>
      <td>
        <form method="post" action="/admin-users/delete" style="display:inline;">
          <input type="hidden" name="user_id" value="${user.id}">
          <button type="submit" class="btn btn-danger">Delete</button>
        </form>
      </td>
    </tr>`).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Digital Mental Health Platform - Users</title>
    <link rel="stylesheet" href="admin-style.css">
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
                        ${userRows}
                    </tbody>
                </table>
            </section>
        </main>
    </div>
</body>
</html>`;
  res.send(html);
});

app.post('/admin-users/delete', requireAdmin, (req, res) => {
  const { user_id } = req.body;
  const index = users.findIndex(u => u.id === user_id);
  if (index !== -1) {
    users.splice(index, 1);
    saveUsers();
  }
  res.redirect('/admin-users');
});

// Admin logout
app.get('/admin-logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin-login.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});