/* eslint-disable */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCYzJypmcVaeSqkPcGwkrNz8KmJ5pPtcJY",
  authDomain: "driving-school-be957.firebaseapp.com",
  projectId: "driving-school-be957",
  storageBucket: "driving-school-be957.appspot.com",
  messagingSenderId: "926061838589",
  appId: "1:926061838589:web:c79e71a7787ba4af4d3e94"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrate() {
  console.log("Starting database separation migration...");
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  console.log(`Found ${snapshot.size} records in 'users' collection.`);

  let migratedCount = 0;

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const role = data.role || data.type || 'student'; // Default fallback
    const id = userDoc.id;

    try {
      if (role === 'student') {
        console.log(`[Student] Moving: ${data.name || id}`);
        await setDoc(doc(db, 'students', id), data);
      } else if (role === 'instructor') {
        console.log(`[Instructor] Moving: ${data.name || id}`);
        await setDoc(doc(db, 'instructors', id), data);
      } else if (role === 'admin') {
        console.log(`[Admin] Moving: ${data.name || id}`);
        await setDoc(doc(db, 'admins', id), data);
      } else {
        console.log(`[Unknown] Defaulting to student: ${id}`);
        await setDoc(doc(db, 'students', id), data);
      }
      
      // Delete from old unified collection
      await deleteDoc(doc(db, 'users', id));
      migratedCount++;
    } catch (err) {
      console.error(`Error migrating ${id}:`, err);
    }
  }

  console.log(`\nMigration completed successfully. Migrated and cleaned ${migratedCount} records.`);
  process.exit(0);
}

migrate().catch(console.error);
