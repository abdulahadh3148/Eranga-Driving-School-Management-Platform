import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyBUT0ozATVCLOR063NbsTzKFUxc5G7LuLg",
  authDomain: "erangadrivingschool.firebaseapp.com",
  projectId: "erangadrivingschool",
  storageBucket: "erangadrivingschool.firebasestorage.app",
  messagingSenderId: "998785584749",
  appId: "1:998785584749:web:95169f408b1c7211bd7964",
  measurementId: "G-534HQ1KDSF"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
