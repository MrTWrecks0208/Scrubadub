import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB_4_Ob2Foy663SmQnUPUrR7uoxieKVsok",
  authDomain: "songcraft-492422.firebaseapp.com",
  projectId: "songcraft-492422",
  storageBucket: "songcraft-492422.firebasestorage.app",
  messagingSenderId: "610778229853",
  appId: "1:610778229853:web:8728657009abe52cecb1b4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-scrubadub-636d09bb-51bf-4dd3-b257-f782715d54a0");
