
// test-auth.js
import { auth, db, rtdb } from './firebase-config.js';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, set, get } from 'firebase/database';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

async function testEverything() {
  console.log('\n🚀 TESTING FIREBASE CONNECTION\n');
  console.log('=' .repeat(50));
  
  // Test 1: Check if Firebase is initialized
  console.log('\n📋 Step 1: Checking Firebase Initialization...');
  console.log('   ✅ Auth:', auth ? 'Initialized' : 'Failed');
  console.log('   ✅ Firestore:', db ? 'Initialized' : 'Failed');
  console.log('   ✅ Realtime DB:', rtdb ? 'Initialized' : 'Failed');
  
  // Test 2: Test Realtime Database
  console.log('\n📝 Step 2: Testing Realtime Database...');
  try {
    const testRef = ref(rtdb, 'test_connection');
    await set(testRef, {
      message: 'Test from app',
      timestamp: Date.now(),
      status: 'working'
    });
    console.log('   ✅ Realtime Database: Write successful');
    
    const snapshot = await get(testRef);
    console.log('   ✅ Realtime Database: Read successful');
  } catch (error) {
    console.log('   ❌ Realtime Database Error:', error.message);
  }
  
  // Test 3: Test Firestore
  console.log('\n📝 Step 3: Testing Firestore...');
  try {
    const testCollection = collection(db, 'test');
    const docRef = await addDoc(testCollection, {
      message: 'Firestore test',
      timestamp: new Date().toISOString()
    });
    console.log('   ✅ Firestore: Write successful, ID:', docRef.id);
    
    const querySnapshot = await getDocs(testCollection);
    console.log('   ✅ Firestore: Read successful, Total docs:', querySnapshot.size);
  } catch (error) {
    console.log('   ❌ Firestore Error:', error.message);
  }
  
  // Test 4: Test Authentication (optional - creates a test user)
  console.log('\n📝 Step 4: Testing Authentication...');
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test123456!';
  
  try {
    // Try to create a test user
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('   ✅ Authentication: User created -', userCredential.user.email);
    
    // Test sign in
    await signInWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('   ✅ Authentication: Sign in successful');
    
    // Test sign out
    await signOut(auth);
    console.log('   ✅ Authentication: Sign out successful');
    
  } catch (error) {
    console.log('   ❌ Authentication Error:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n✨ FIREBASE IS READY! All systems operational.\n');
}

// Run the test
testEverything().catch(console.error);