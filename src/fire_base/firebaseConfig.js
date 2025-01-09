// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAVLXfQo1bL6ueVYbFU2Xw64T9ayFP619s",
  authDomain: "taskmanager-2025.firebaseapp.com",
  projectId: "taskmanager-2025",
  storageBucket: "taskmanager-2025.firebasestorage.app",
  messagingSenderId: "528444989837",
  appId: "1:528444989837:web:308ca3cf10632ef6255dc4",
  measurementId: "G-T11JGNQZFS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();