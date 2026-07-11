import { db } from '../firebase/config';
import { doc, runTransaction } from 'firebase/firestore';

/**
 * Generates a custom formatted ID using a Firebase Transaction to ensure uniqueness.
 * @param {string} prefix - The 3-letter prefix (e.g., 'EDS', 'INS', 'PAY')
 * @returns {Promise<string>} The generated ID (e.g., 'EDS001')
 */
export const generateCustomId = async (prefix) => {
  const counterRef = doc(db, 'counters', prefix);

  try {
    const newIdString = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let currentCount = 0;

      if (counterDoc.exists()) {
        currentCount = counterDoc.data().lastId || 0;
      }

      const nextCount = currentCount + 1;
      
      // Update or create the counter document
      transaction.set(counterRef, { lastId: nextCount }, { merge: true });

      // Format with leading zeros (e.g., 001, 012, 105)
      const formattedNumber = nextCount.toString().padStart(3, '0');
      return `${prefix}${formattedNumber}`;
    });

    return newIdString;
  } catch (error) {
    console.error(`Transaction failed for prefix ${prefix}:`, error);
    // eslint-disable-next-line
    throw new Error(`Failed to generate custom ID for ${prefix}`);
  }
};
