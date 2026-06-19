import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase, ref, set, get, push, onValue, child } from "firebase/database";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAO7psKr8pMj2JFMZw5aIkZrhQuQYC_FyA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "seatiket-2ddf9.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://seatiket-2ddf9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "seatiket-2ddf9",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "seatiket-2ddf9.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "157453105265",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:157453105265:web:941342ee4f3b801e5983d0",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-NHKYFDEENZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
let analytics = null;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}
const db = getDatabase(app);
const auth = getAuth(app);

export { app, analytics, db, auth, ref, set, get, push, onValue, child };
