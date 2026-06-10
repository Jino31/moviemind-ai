import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  initializeAuth,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyColfrF7tfhhflJWoVx2GW-WvInheUTDXk",
  authDomain: "moviemind-25984.firebaseapp.com",
  projectId: "moviemind-25984",
  storageBucket: "moviemind-25984.firebasestorage.app",
  messagingSenderId: "986863262205",
  appId: "1:986863262205:web:b495e799970ad1c5e2e194",
   measurementId: "G-VH3W61WCSK"
};

const app = initializeApp(firebaseConfig);

// Use initializeAuth instead of getAuth — fixes redirect in Chrome/Brave
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence,
  popupRedirectResolver: browserPopupRedirectResolver,
});

export const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export const db = getFirestore(app);

console.log("✅ Firebase initialized");