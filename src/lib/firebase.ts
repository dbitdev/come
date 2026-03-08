import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAPt2Qka3rhBblhjZO0tg7-gg4pL2zYV-0",
  authDomain: "comeappmx.firebaseapp.com",
  projectId: "comeappmx",
  storageBucket: "comeappmx.firebasestorage.app",
  messagingSenderId: "554971133009",
  appId: "1:554971133009:web:3b8cfe3cebc25bf8457470"
};

// Initialize Firebase (singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
