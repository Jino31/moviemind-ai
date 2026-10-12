// src/firebase.js
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  initializeAuth,
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyColfrF7tfhhflJWoVx2GW-WvInheUTDXk",
  authDomain: "moviemind-25984.firebaseapp.com",
  projectId: "moviemind-25984",
  storageBucket: "moviemind-25984.firebasestorage.app",
  messagingSenderId: "986863262205",
  appId: "1:986863262205:web:b495e799970ad1c5e2e194",
  measurementId: "G-VH3W61WCSK"
};

// Initialize Firebase only once
const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

// Initialize Analytics (safely checks if running in browser)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Analytics might fail in some server-side or strict privacy browser environments
}

// Initialize Firebase Authentication
let auth;
try {
  auth = initializeAuth(app, {
    persistence: browserLocalPersistence,
    popupRedirectResolver: browserPopupRedirectResolver,
  });
} catch (error) {
  if (error.code === "auth/already-initialized") {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

export { auth };

// Google Authentication Provider
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: "select_account",
});

// Firestore Database
export const db = getFirestore(app);

// Gemini AI Initialization (Optional: safe fallback if key isn't provided)
const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

export const ai = geminiApiKey
  ? new GoogleGenAI({ apiKey: geminiApiKey })
  : null;

if (ai) {
  console.info("Gemini AI initialized successfully");
} else {
  console.warn(
    "Gemini AI is disabled. Configure VITE_GEMINI_API_KEY to enable AI features."
  );
}

console.info("Firebase initialized successfully");