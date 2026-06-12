// frontend/src/firebase.js

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// 🤖 Import the official Google Gen AI SDK for client-side processing
import { GoogleGenAI } from "@google/genai";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "", // Loaded securely from your environment variables
  authDomain: "moviemind-25984.firebaseapp.com",
  projectId: "moviemind-25984",
  storageBucket: "moviemind-25984.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize the core Firebase App instance
const app = initializeApp(firebaseConfig);

// 🔒 Initialize and export Auth with browser state persistence
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

// 🌐 Configure and export Google OAuth Identity Provider
export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// 📥 Initialize and export Cloud Firestore Database handler
export const db = getFirestore(app);

// 🧠 Initialize and export the Google Gen AI Core Engine 
// This reads your Gemini API token securely from your frontend project's root .env file
export const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

console.log("✅ Firebase Engine & Gemini AI Core initialized successfully");