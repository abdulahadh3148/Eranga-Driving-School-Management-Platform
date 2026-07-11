import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBUT0ozATVCLOR063NbsTzKFUxc5G7LuLg",
  authDomain: "erangadrivingschool.firebaseapp.com",
  projectId: "erangadrivingschool",
  storageBucket: "erangadrivingschool.firebasestorage.app",
  messagingSenderId: "998785584749",
  appId: "1:998785584749:web:95169f408b1c7211bd7964",
  measurementId: "G-534HQ1KDSF"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    console.log('--- USERS ---');
    usersSnap.forEach(d => console.log(d.id, JSON.stringify(d.data(), null, 2)));

    const instSnap = await getDocs(collection(db, 'instructors'));
    console.log('--- INSTRUCTORS ---');
    instSnap.forEach(d => console.log(d.id, JSON.stringify(d.data(), null, 2)));
    // eslint-disable-next-line no-undef
    process.exit(0);
  } catch (err) {
    console.error('Error running script:', err);
    // eslint-disable-next-line no-undef
    process.exit(1);
  }
}

run();
