const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
admin.initializeApp();

/**
 * Generate PayHere payment hash securely on the server.
 */
exports.generatePayHereHash = functions.https.onCall((data, context) => {
  const { orderId, amount, currency = 'LKR' } = data;
  
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in to generate payment hash.');
  }
  if (!orderId || !amount) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing orderId or amount');
  }

  // Uses environment variables in production, fallback to sandbox config for testing
  const merchantId = process.env.PAYHERE_MERCHANT_ID || '1237014';
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || 'MjIzNDQ2MTkzNzY5MTA2MjI5MDYzMDQzODY2MTE3MTE4Njk1MjI=';

  const amountFormatted = Number(amount).toFixed(2);
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const hashString = merchantId + orderId + amountFormatted + currency + secretHash;
  const hash = crypto.createHash('md5').update(hashString).digest('hex').toUpperCase();

  return { hash, merchantId, currency };
});
/**
 * Triggers when a new document is added to the 'notifications' collection.
 * It reads the 'userId' field from the notification, looks up that user's 'fcmToken',
 * and sends an FCM push notification.
 */
exports.sendPushNotification = functions.firestore
  .document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const notificationData = snap.data();
    
    const userId = notificationData.userId;
    if (!userId) {
      console.log('No userId attached to notification, skipping.');
      return null;
    }

    try {
      // 1. Find the user's fcmToken. 
      // Assuming users are stored in the 'students' collection based on your app structure.
      const userDoc = await admin.firestore().collection('students').doc(userId).get();
      
      if (!userDoc.exists) {
        console.log(`User ${userId} not found in students collection.`);
        return null;
      }

      const fcmToken = userDoc.data().fcmToken;
      if (!fcmToken) {
        console.log(`User ${userId} does not have an FCM token.`);
        return null;
      }

      // 2. Construct the push notification payload
      const payload = {
        notification: {
          title: notificationData.title || 'Eranga Driving School',
          body: notificationData.message || 'You have a new notification!',
        },
        token: fcmToken
      };

      // 3. Send the notification via FCM
      const response = await admin.messaging().send(payload);
      console.log('Successfully sent push notification:', response);
      return response;
      
    } catch (error) {
      console.error('Error sending push notification:', error);
      return null;
    }
  });
