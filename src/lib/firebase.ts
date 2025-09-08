import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Debug environment variables (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase Config Check:', {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasStorageBucket: !!firebaseConfig.storageBucket,
    hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
    hasAppId: !!firebaseConfig.appId
  });
}

// Initialize Firebase
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  // Check if all required config values are present
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig]);
  
  if (missingFields.length > 0) {
    console.error('Missing Firebase configuration:', missingFields);
    console.error('Please set the following environment variables:');
    missingFields.forEach(field => {
      console.error(`- NEXT_PUBLIC_FIREBASE_${field.toUpperCase()}`);
    });
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    console.log('Firebase initialized successfully with project:', firebaseConfig.projectId);
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
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
    isDemo: false,
    missingFields: ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId']
      .filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])
  };
};

export { auth, db, storage };
export default app; 