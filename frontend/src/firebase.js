// frontend/src/firebase.js

import { initializeApp, getApp, getApps } from "firebase/app";

import {
  initializeAuth,
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { GoogleGenAI } from "@google/genai";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "moviemind-25984.firebaseapp.com",
  projectId: "moviemind-25984",
  storageBucket: "moviemind-25984.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase configuration
const requiredFirebaseFields = [
  "apiKey",
  "authDomain",
  "projectId",
  "appId",
];

const missingFirebaseFields = requiredFirebaseFields.filter(
  (field) => !firebaseConfig[field]
);

if (missingFirebaseFields.length > 0) {
  throw new Error(
    `Missing Firebase configuration: ${missingFirebaseFields.join(", ")}. Check your frontend .env file.`
  );
}

// Initialize Firebase only once
const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

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

// Gemini AI Initialization
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