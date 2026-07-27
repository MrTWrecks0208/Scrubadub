import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBMjxtzUxfGrGd7fVR3BI-O1ggZ0GC2Qk0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "scrubadub-503303.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "scrubadub-503303",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "scrubadub-503303.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "961220374229",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:961220374229:web:1beca636825032e95b7c5c"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Initialize Firestore with the provisioned database ID
const DATABASE_ID = "ai-studio-scrubadub-636d09bb-51bf-4dd3-b257-f782715d54a0";

let dbInstance;
try {
  dbInstance = getFirestore(app, DATABASE_ID);
} catch (e) {
  console.warn("Could not initialize custom Firestore database ID, falling back:", e);
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

