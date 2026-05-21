const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const serviceAccount = require('./digital-mental-health-pl-7df78-firebase-adminsdk-fbsvc-b5a9543bbb.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Admin login route - supports both JSON and form data
app.post('/admin-login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  console.log('Login attempt:', { username, password }); // Debug log
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.is_admin = true;
    req.session.save();
    console.log('Login successful');
    res.json({ success: true, redirect: '/admin-dashboard' });
  } else {
    console.log('Login failed');
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/admin-dashboard', (req, res) => {
  if (!req.session.is_admin) {
    return res.redirect('/admin-login.html');
  }
  res.sendFile(__dirname + '/admin-dashboard.html');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin login: http://localhost:${PORT}/admin-login`);
  console.log(`Username: admin`);
  console.log(`Password: admin123`);
});
