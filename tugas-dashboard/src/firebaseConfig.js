// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  // Masukkan API Key & ID lainnya dari Firebase Console Anda
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "riskdashboard-6c670.firebaseapp.com",
  databaseURL: "https://riskdashboard-6c670-default-rtdb.firebaseio.com/",
  projectId: "riskdashboard-6c670",
  storageBucket: "riskdashboard-6c670.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
