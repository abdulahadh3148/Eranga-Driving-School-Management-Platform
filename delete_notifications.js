import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Replace with your Firebase config if needed, or import from your config file
import { firebaseConfig } from './src/firebase/config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllNotifications() {
  console.log("Deleting all notifications...");
  const nQ = collection(db, "notifications");
  const snap = await getDocs(nQ);
  let count = 0;
  for (const document of snap.docs) {
    await deleteDoc(doc(db, "notifications", document.id));
    count++;
  }
  console.log(`Deleted ${count} notifications.`);
  process.exit(0);
}

deleteAllNotifications();
