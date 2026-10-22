import { initializeApp, getApps, getApp } from "firebase/app";
// Notice we added 'Auth' to the end of this import list:
import { getAuth, initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// FIX: We explicitly tell TypeScript that this variable is a Firebase Auth instance
let auth: Auth;

if (typeof window !== "undefined") {
  try {
    auth = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence]
    });
  } catch (error) {
    auth = getAuth(app);
  }
} else {
  auth = getAuth(app);
}

export { app, auth, db };