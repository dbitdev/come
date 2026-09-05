import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, getFirestore, Firestore, terminate, setLogLevel } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// En producción (Firebase App Hosting) la configuración llega en
// FIREBASE_WEBAPP_CONFIG, que el propio App Hosting inyecta a partir del web
// app enlazado al backend; en local viene del .env.local. Se prefiere lo
// explícito y se cae a lo inyectado.
function configDelHosting(): Record<string, string> {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_WEBAPP_CONFIG || "{}");
  } catch {
    return {};
  }
}

const inyectada = configDelHosting();

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || inyectada.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || inyectada.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || inyectada.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || inyectada.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || inyectada.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || inyectada.appId
};

// Validation
const isConfigValid = !!firebaseConfig.apiKey;

// Producción (proyecto mxicapp) usa la base (default). Sólo si se define
// NEXT_PUBLIC_FIRESTORE_DB_ID se apunta a una base con nombre, como la `hueyi`
// que se usó durante el desarrollo.
const DB_ID = process.env.NEXT_PUBLIC_FIRESTORE_DB_ID?.trim();

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isConfigValid) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        
        // Use singleton pattern for Firestore to avoid multiple initialization errors
        if (typeof window !== "undefined") {
            // setLogLevel('debug'); // Uncomment for troubleshooting
            
            // Force long polling on client side for maximum compatibility
            // databaseId is the third parameter of initializeFirestore
            const opciones = { experimentalForceLongPolling: true };
            db = DB_ID ? initializeFirestore(app, opciones, DB_ID) : initializeFirestore(app, opciones);
        } else {
            db = DB_ID ? getFirestore(app, DB_ID) : getFirestore(app);
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
