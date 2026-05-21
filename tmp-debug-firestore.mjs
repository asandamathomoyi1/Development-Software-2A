import { db } from './firebase-admin-config.js';
const snapshot = await db.collection('mood_entries').limit(20).get();
console.log('count', snapshot.size);
snapshot.docs.forEach(doc => console.log(doc.id, JSON.stringify(doc.data())));
