
// Firebase configuration based on firebase_barebones_javascript integration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD7m1VKeOrxGvHFHJT-Cr0PVZBBHhiGDMw",
  authDomain: "geo-attendance-system-179a4.firebaseapp.com",
  projectId: "geo-attendance-system-179a4",
  storageBucket: "geo-attendance-system-179a4.firebasestorage.app",
  messagingSenderId: "53451957706",
  appId: "1:53451957706:web:885a22cb2f69d852fa1b33",
  measurementId: "G-LMP6D1VW54"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
