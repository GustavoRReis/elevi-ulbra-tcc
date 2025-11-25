// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBiPqOQXH0v5o81D2NJFkCzpwV4csYnmf8",
  authDomain: "elevi-tcc.firebaseapp.com",
  projectId: "elevi-tcc",
  storageBucket: "elevi-tcc.firebasestorage.app",
  messagingSenderId: "74484790356",
  appId: "1:74484790356:web:a8cd76195b3ed5583a29c1",
  measurementId: "G-DCC5SJCY7C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only in browser
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Initialize Messaging only in browser
let messaging;
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  messaging = getMessaging(app);
}

export { analytics, messaging };
export default app;

