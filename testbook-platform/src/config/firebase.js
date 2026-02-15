import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDFuLfVeFnxke-rUuClj4gjvpI_h4_X1aQ",
  authDomain: "harxshit-in-app.firebaseapp.com",
  projectId: "harxshit-in-app",
  storageBucket: "harxshit-in-app.firebasestorage.app",
  messagingSenderId: "491665024466",
  appId: "1:491665024466:web:056dddba679998888b940b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth, db, and storage instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
