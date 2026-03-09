import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validation to avoid build crash if config is missing
const isConfigValid = !!firebaseConfig.apiKey;

if (typeof window !== "undefined") {
  console.log("Firebase config check:", isConfigValid ? "Valid" : "Missing API Key");
}

const app = isConfigValid 
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApp())
  : null;

const auth = app ? getAuth(app) : null as any;

// Use initializeFirestore with long-polling capability for better stability in different networks
const db = app 
  ? initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    }) 
  : null as any;

const storage = app ? getStorage(app) : null as any;

export { app, auth, db, storage };
export default app;
