// Browser-friendly CDN ESM imports (works without a bundler)
console.log('firebase-config.js loaded');
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getFirestore, collection, doc, setDoc, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getDatabase, ref, push, set, onValue, get } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, updateProfile } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAX3rbREm6yYzs5KYFQZh04dGzX17Shxyg",
  authDomain: "digital-mental-health-pl-7df78.firebaseapp.com",
  databaseURL: "https://digital-mental-health-pl-7df78-default-rtdb.firebaseio.com",
  projectId: "digital-mental-health-pl-7df78",
  storageBucket: "digital-mental-health-pl-7df78.firebasestorage.app",
  messagingSenderId: "257861328568",
  appId: "1:257861328568:web:b7b8b351c728993ab971e4d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Export auth functions
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  updateProfile,
  signInWithPopup 
};

// ===== HELPER FUNCTIONS =====
export async function saveMoodEntry(userId, mood, moodLabel, feeling) {
  return await addDoc(collection(db, 'mood_entries'), {
    userId: userId,
    mood: mood,
    moodLabel: moodLabel,
    feeling: feeling,
    timestamp: serverTimestamp(),
    date: new Date().toLocaleDateString()
  });
}

export async function getUserMoodEntries(userId) {
  const q = query(
    collection(db, 'mood_entries'),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(30)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveUserToFirestore(uid, name, email) {
  return await setDoc(doc(db, 'users', uid), {
    uid: uid,
    name: name,
    email: email,
    createdAt: serverTimestamp()
  });
}

export default app;