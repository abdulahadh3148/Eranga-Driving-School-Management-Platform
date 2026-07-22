importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCYzJypmcVaeSqkPcGwkrNz8KmJ5pPtcJY",
  authDomain: "driving-school-be957.firebaseapp.com",
  projectId: "driving-school-be957",
  storageBucket: "driving-school-be957.firebasestorage.app",
  messagingSenderId: "926061838589",
  appId: "1:926061838589:web:c79e71a7787ba4af4d3e94"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Eranga Driving School';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/favicon.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
