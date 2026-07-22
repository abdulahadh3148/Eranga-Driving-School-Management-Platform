import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: "AIzaSyCYzJypmcVaeSqkPcGwkrNz8KmJ5pPtcJY",
  authDomain: "driving-school-be957.firebaseapp.com",
  projectId: "driving-school-be957",
  storageBucket: "driving-school-be957.firebasestorage.app",
  messagingSenderId: "926061838589",
  appId: "1:926061838589:web:c79e71a7787ba4af4d3e94"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🚀 Enable offline caching to significantly reduce latency and make the app ultra-fast
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Caching limited: Multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    console.warn('Browser does not support caching.');
  }
});

export const storage = getStorage(app);

// Initialize Messaging only if supported by the browser (to prevent crashes in unsupported environments)
export let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
}).catch(err => console.warn('Firebase Messaging not supported:', err));
