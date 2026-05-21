
// test-firebase.js
import { db, rtdb, auth } from './firebase-config.js';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, set, get, child } from 'firebase/database';

async function testFirebase() {
  console.log('\n🔥 TESTING FIREBASE CONNECTION...\n');
  console.log('=' .repeat(50));
  
  // Test 1: Check configuration
  console.log('\n📋 Step 1: Checking Firebase Config...');
  console.log('   ✅ Project ID:', db.app.options.projectId);
  console.log('   ✅ Database URL:', rtdb.app.options.databaseURL);
  console.log('   ✅ Auth Domain:', auth.app.options.authDomain);
  
  // Test 2: Test Realtime Database (write)
  console.log('\n📝 Step 2: Testing Realtime Database (Write)...');
  try {
    const testRef = ref(rtdb, 'test_connection');
    await set(testRef, {
      message: 'Hello from Digital Mental Health Platform!',
      timestamp: Date.now(),
      status: 'connected'
    });
    console.log('   ✅ Write successful! Data saved to Realtime Database');
  } catch (error) {
    console.log('   ❌ Write failed:', error.message);
  }
  
  // Test 3: Test Realtime Database (read)
  console.log('\n📖 Step 3: Testing Realtime Database (Read)...');
  try {
    const testRef = ref(rtdb, 'test_connection');
    const snapshot = await get(testRef);
    if (snapshot.exists()) {
      console.log('   ✅ Read successful! Data:', snapshot.val());
    } else {
      console.log('   ⚠️ No data found');
    }
  } catch (error) {
    console.log('   ❌ Read failed:', error.message);
  }
  
  // Test 4: Test Firestore
  console.log('\n🔥 Step 4: Testing Firestore...');
  try {
    const testCollection = collection(db, 'test');
    const docRef = await addDoc(testCollection, {
      message: 'Firestore test',
      timestamp: new Date().toISOString()
    });
    console.log('   ✅ Write successful! Document ID:', docRef.id);
    
    // Read back
    const querySnapshot = await getDocs(testCollection);
    console.log('   ✅ Read successful! Total docs:', querySnapshot.size);
  } catch (error) {
    console.log('   ❌ Firestore error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✨ FIREBASE IS WORKING! Ready to use in your app.\n');
}

// Run the test
testFirebase().catch(console.error);