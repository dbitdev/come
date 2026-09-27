import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const credential = serviceAccount
  ? cert(JSON.parse(serviceAccount))
  : applicationDefault();

export const adminApp = getApps()[0] || initializeApp({
  credential,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const databaseId = process.env.NEXT_PUBLIC_FIRESTORE_DB_ID?.trim();

export const adminAuth = getAuth(adminApp);
export const adminDb = databaseId ? getFirestore(adminApp, databaseId) : getFirestore(adminApp);
