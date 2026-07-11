/* eslint-disable */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

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

async function migrate() {
  console.log("Starting database migration...");
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  console.log(`Found ${snapshot.size} users.`);

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const role = data.role || data.type;
    const id = userDoc.id;

    if (role === 'instructor') {
      console.log(`Migrating instructor: ${data.name || id}`);
      
      // Store complete detailed info in 'instructors' collection
      await setDoc(doc(db, 'instructors', id), data);

      // Keep only basic auth info in 'users' collection
      const authData = {
        authUid: data.authUid || null,
        email: data.email || null,
        role: 'instructor'
      };
      await setDoc(doc(db, 'users', id), authData);

    } else if (role === 'student') {
      console.log(`Migrating student: ${data.name || id}`);
      
      // Store complete detailed info in 'students' collection
      await setDoc(doc(db, 'students', id), data);

      // Keep only basic auth info in 'users' collection
      const authData = {
        authUid: data.authUid || null,
        email: data.email || null,
        role: 'student'
      };
      await setDoc(doc(db, 'users', id), authData);
    } else {
      console.log(`Skipping user: ${id} with role: ${role}`);
    }
  }

  console.log("Migration completed successfully.");
  // eslint-disable-next-line no-undef
  process.exit(0);
}

migrate().catch(console.error);
