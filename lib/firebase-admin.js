import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK with proper error handling
let adminApp = null;
let adminAuth = null;
let adminDb = null;

try {
  // Check if Firebase Admin app already exists
  const existingApps = getApps();
  if (existingApps.length === 0) {
    // Initialize with service account credentials
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    // Validate required configuration
    if (!firebaseConfig.projectId) {
      throw new Error('Firebase Project ID is required');
    }

    // Initialize with credentials if available, otherwise use default
    if (firebaseConfig.clientEmail && firebaseConfig.privateKey) {
      adminApp = initializeApp({
        credential: cert(firebaseConfig),
        projectId: firebaseConfig.projectId,
      });
    } else {
      // Fallback to default credentials (for local development or Vercel with service account)
      adminApp = initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  } else {
    adminApp = existingApps[0];
  }

  // Initialize Auth and Firestore
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase Admin SDK initialization failed:', error.message);
  
  // Create mock implementations for development
  adminAuth = {
    verifyIdToken: async () => {
      throw new Error('Firebase Admin not configured');
    }
  };
  
  adminDb = {
    collection: () => ({
      doc: () => ({
        set: async () => {
          console.warn('Firestore not configured - operation skipped');
        },
        get: async () => ({
          exists: false,
          data: () => null
        })
      })
    })
  };
}

// Helper function to verify user token
export async function verifyUserToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid authorization header');
  }

  const token = authHeader.substring(7);
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      userId: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);
    throw new Error('Invalid or expired token');
  }
}

// Helper function to get user data from Firestore
export async function getUserData(userId) {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('Failed to get user data:', error.message);
    return null;
  }
}

// Helper function to update user data in Firestore
export async function updateUserData(userId, data) {
  try {
    await adminDb.collection('users').doc(userId).set(data, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to update user data:', error.message);
    return false;
  }
}

export { adminApp, adminAuth, adminDb };
export default adminApp;
