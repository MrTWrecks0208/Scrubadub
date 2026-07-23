import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBMjxtzUxfGrGd7fVR3BI-O1ggZ0GC2Qk0",
  authDomain: "scrubadub-503303.firebaseapp.com",
  projectId: "scrubadub-503303",
  storageBucket: "scrubadub-503303.firebasestorage.app",
  messagingSenderId: "961220374229",
  appId: "1:961220374229:web:1beca636825032e95b7c5c"
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);

// Use default Firestore database for the configured Firebase project
let dbInstance;
try {
  dbInstance = getFirestore(app);
} catch (e) {
  console.warn("Could not initialize Firestore instance:", e);
  dbInstance = getFirestore(app);
}

export const db = dbInstance;

