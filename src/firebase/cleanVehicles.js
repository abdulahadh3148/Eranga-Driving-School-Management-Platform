import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

export const cleanDuplicateVehicles = async () => {
  try {
    console.log("Starting duplicate vehicle cleanup...");
    const snap = await getDocs(collection(db, 'vehicles'));
    
    // Group by uppercase numberPlate
    const plates = {};
    snap.docs.forEach(d => {
      const v = { id: d.id, ...d.data() };
      if (!v.numberPlate) return;
      const key = v.numberPlate.toUpperCase();
      if (!plates[key]) plates[key] = [];
      plates[key].push(v);
    });

    let deletedCount = 0;

    for (const [plate, group] of Object.entries(plates)) {
      if (group.length > 1) {
        // Sort by updatedAt descending so the latest is first
        group.sort((a, b) => {
          const dateA = new Date(a.updatedAt || a.createdAt || 0);
          const dateB = new Date(b.updatedAt || b.createdAt || 0);
          return dateB - dateA;
        });

        // Keep the first one (most recent), delete the rest
        const toKeep = group[0];
        const toDelete = group.slice(1);

        console.log(`Found duplicates for plate ${plate}. Keeping ID ${toKeep.id}.`);

        for (const v of toDelete) {
          // Permanently delete from database since it's a structural error
          await deleteDoc(doc(db, 'vehicles', v.id));
          console.log(`Deleted duplicate vehicle ID: ${v.id}`);
          deletedCount++;
        }
      }
    }
    
    console.log(`Cleanup complete! Deleted ${deletedCount} duplicate vehicles.`);
  } catch (error) {
    console.error("Error during vehicle cleanup:", error);
  }
};
