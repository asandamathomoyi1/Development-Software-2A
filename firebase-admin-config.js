import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin with your project credentials
// NOTE: You'll need to download your service account key from Firebase Console
// Go to: Project Settings > Service Accounts > Generate New Private Key
// Save it as serviceAccountKey.json in this project directory

let serviceAccount;
try {
  const keyPath = path.join(__dirname, 'digital-mental-health-pl-7df78-firebase-adminsdk-fbsvc-b5a9543bbb.json');
  const keyFile = readFileSync(keyPath, 'utf8');
  serviceAccount = JSON.parse(keyFile);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  try {
    const keyPath = path.join(__dirname, 'serviceAccountKey.json');
    const keyFile = readFileSync(keyPath, 'utf8');
    serviceAccount = JSON.parse(keyFile);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (err) {
    console.log('Warning: No service account key found. Using default initialization.');
    admin.initializeApp({
      projectId: 'digital-mental-health-pl-7df78'
    });
  }
}

const db = admin.firestore();

export { admin, db };
