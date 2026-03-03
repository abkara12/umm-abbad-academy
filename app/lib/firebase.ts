// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHHIRRDoIRHkzhWSLtcBOFMJi3wa3-znI",
  authDomain: "ys2-thehifdhjournal.firebaseapp.com",
  projectId: "ys2-thehifdhjournal",
  storageBucket: "ys2-thehifdhjournal.firebasestorage.app",
  messagingSenderId: "962912820364",
  appId: "1:962912820364:web:07a1b28fd206fdcb242fa9"
};


const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
