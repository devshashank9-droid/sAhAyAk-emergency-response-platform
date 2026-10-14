import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDIEv9As4TWSHDxfXKENZSs4L9eBg5vnlM",
  authDomain: "emergency-sos-9ff55.firebaseapp.com",
  projectId: "emergency-sos-9ff55",
  storageBucket: "emergency-sos-9ff55.firebasestorage.app",
  messagingSenderId: "504311713957",
  appId: "1:504311713957:web:ff1455665bd67f8772bd4c"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };