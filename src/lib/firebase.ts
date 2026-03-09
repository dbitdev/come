import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore, terminate, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Validation
const isConfigValid = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isConfigValid) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        
        // Use singleton pattern for Firestore to avoid multiple initialization errors
        if (typeof window !== "undefined") {
            // Enable debug logging to help identify why it hangs
            setLogLevel('debug');
            
            // Force long polling on client side for maximum compatibility
            db = initializeFirestore(app, {
                experimentalForceLongPolling: true,
                databaseId: "come"
            });
            console.log("Firebase & Firestore initialized successfully (Long Polling & Debug enabled)");
        } else {
            db = getFirestore(app);
        }
    } catch (error) {
        console.error("Error initializing Firebase:", error);
    }
} else {
    if (typeof window !== "undefined") {
        console.warn("Firebase config is missing or invalid. Check your environment variables.");
    }
}

const auth = app ? getAuth(app) : null as any;
const storage = app ? getStorage(app) : null as any;

export { app, auth, db, storage };
export default app;
