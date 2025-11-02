import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD6qEOlQ62V6_eoiAmvU1KMfZu_oNPkddM",
  authDomain: "rock-idiom-475618-q4.firebaseapp.com", // Replace with yours
  projectId: "rock-idiom-475618-q4", // Replace
  storageBucket: "rock-idiom-475618-q4.firebasestorage.app", // Replace
  messagingSenderId: "71583131863", // Replace
  appId: "1:71583131863:web:cf8f5169f1a928fdd92892" // Replace
};

// Initialize app only if it doesn't exist (prevents duplicate-app error)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set persistence IMMEDIATELY (before exports are used)
setPersistence(auth, browserLocalPersistence).catch(console.error);