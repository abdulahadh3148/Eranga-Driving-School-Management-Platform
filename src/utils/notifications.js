import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db, messaging } from '../firebase/config';
import { getToken } from 'firebase/messaging';

/**
 * Sends a notification by creating a document in the 'notifications' collection.
 * 
 * @param {Object} params 
 * @param {string} params.userId - Target user ID (or role like 'admin').
 * @param {string} params.title - Notification title.
 * @param {string} params.message - Notification body text.
 * @param {string} params.type - 'success', 'warning', 'info', 'error'
 * @param {string} [params.link] - Optional URL path to navigate to when clicked.
 */
export const sendNotification = async ({ userId, title, message, type = 'info', link = null }) => {
  try {
    if (!userId) {
      console.warn('sendNotification: missing userId');
      return;
    }

    await addDoc(collection(db, 'notifications'), {
      userId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('Error sending notification:', err);
  }
};

/**
 * Requests permission for Push Notifications (FCM) and saves the token to Firestore.
 * 
 * @param {string} userId - The document ID of the user in Firestore
 * @param {string} collectionName - 'students', 'instructors', or 'users'
 * @returns {Promise<string|null>} The token, or null if failed/denied
 */
export const requestFCMPermission = async (userId, collectionName = 'students') => {
  if (!messaging) {
    console.warn('Firebase messaging is not supported or not initialized.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { 
        vapidKey: 'BB9wy_i6TlPZGg6yUu_WA10cIBe39HAVBIgvX4IYF2N7gEosvFDFcZ91rb-3J2weiPj4uTnZHrKZK94YgFPjGog' 
      });

      if (currentToken) {
        // Save the token to the user's document in Firestore
        await updateDoc(doc(db, collectionName, userId), {
          fcmToken: currentToken
        });
        console.log('FCM Token generated and saved successfully:', currentToken);
        return currentToken;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
      }
    } else {
      console.warn('Notification permission denied by user.');
    }
  } catch (err) {
    console.error('An error occurred while retrieving FCM token:', err);
  }
  return null;
};
