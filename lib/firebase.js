import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Only initialize Firebase if we have valid configuration and no existing app
let app = null;
let auth = null;
let db = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    // Check if Firebase app already exists
    const existingApps = getApps();
    if (existingApps.length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = existingApps[0];
    }
    
    auth = getAuth(app);
    
    // Initialize Firestore with production-optimized settings
    try {
      db = initializeFirestore(app, {
        experimentalForceLongPolling: false, // Use WebChannel for better performance
        ignoreUndefinedProperties: true,
        cacheSizeBytes: 40000000, // 40MB cache
      });
    } catch (firestoreError) {
      console.warn('Firestore initialization failed, falling back to default:', firestoreError.message);
      try {
        db = getFirestore(app);
      } catch (fallbackError) {
        console.warn('Firestore fallback failed:', fallbackError.message);
        db = null;
      }
    }
  } else {
    console.warn('Firebase configuration incomplete - running in demo mode');
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error.message);
}

export { auth, db };
export default app;
