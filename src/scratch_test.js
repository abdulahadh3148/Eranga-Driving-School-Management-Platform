import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCYzJypmcVaeSqkPcGwkrNz8KmJ5pPtcJY",
  authDomain: "driving-school-be957.firebaseapp.com",
  projectId: "driving-school-be957",
  storageBucket: "driving-school-be957.firebasestorage.app",
  messagingSenderId: "926061838589",
  appId: "1:926061838589:web:c79e71a7787ba4af4d3e94"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixData() {
  console.log("=== SCANNING FOR CORRUPT SESSIONS ===");
  const sessionsSnap = await getDocs(collection(db, 'sessions'));
  
  let count = 0;
  for (const sessionDoc of sessionsSnap.docs) {
    const data = sessionDoc.data();
    
    // Check for the specific corruption: Kusun Jayamal named but pointing to EDS005
    if (data.studentId === 'EDS005' && data.studentName === 'Kusun Jayamal') {
      console.log(`Found corrupted session: ${sessionDoc.id}. Deleting...`);
      await deleteDoc(doc(db, 'sessions', sessionDoc.id));
      count++;
    }
  }
  
  console.log(`\n=== CLEANUP COMPLETE. Deleted ${count} corrupted session(s). ===`);
}

fixData().catch(console.error);
