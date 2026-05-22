import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config();

// Get the key path from .env
const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (!keyPath) {
  console.error('ERROR: GOOGLE_APPLICATION_CREDENTIALS not set in .env file');
  process.exit(1);
}

try {
  const fullPath = join(__dirname, keyPath);
  const serviceAccount = JSON.parse(readFileSync(fullPath, 'utf8'));
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('ERROR: Failed to load service account key:', error.message);
  console.error('Expected key at:', join(__dirname, keyPath));
  process.exit(1);
}

const db = admin.firestore();

export { admin, db };
