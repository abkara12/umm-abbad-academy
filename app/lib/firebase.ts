// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDj_LXXIZq33M-_ihnws3rBbZAC0R6gDn0",
  authDomain: "umm-abbad-academy.firebaseapp.com",
  projectId: "umm-abbad-academy",
  storageBucket: "umm-abbad-academy.firebasestorage.app",
  messagingSenderId: "132251508750",
  appId: "1:132251508750:web:1f52b6fb57026ee90b1c5f"
};


const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
