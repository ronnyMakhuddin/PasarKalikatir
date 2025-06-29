import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id'
};

// Initialize Firebase only if we have valid config
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

try {
  // Only initialize if we have a real API key (not demo)
  if (firebaseConfig.apiKey !== 'demo-key' && firebaseConfig.projectId !== 'demo-project') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('Firebase initialized successfully');
  } else {
    console.warn('Firebase not configured - using demo mode. Please set up environment variables.');
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error);
}

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = () => {
  return app !== null && auth !== null && db !== null;
};

// Helper function to get Firebase status
export const getFirebaseStatus = () => {
  return {
    isConfigured: isFirebaseConfigured(),
    hasAuth: auth !== null,
    hasFirestore: db !== null,
    hasStorage: storage !== null,
    projectId: firebaseConfig.projectId,
    isDemo: firebaseConfig.projectId === 'demo-project'
  };
};

export { auth, db, storage };
export default app; 