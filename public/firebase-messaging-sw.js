importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDTfV9As4TWSHDXfXKFN7Ss4l9eBg5vnlM",
  authDomain: "emergency-sos-9ff55.firebaseapp.com",
  projectId: "emergency-sos-9ff55",
  storageBucket: "emergency-sos-9ff55.firebasestorage.app",
  messagingSenderId: "504311713957",
  appId: "1:504311713957:web:ff1455665bd67f8772bd4c"
});

const messaging = firebase.messaging();

// This triggers when the app is in the background or closed
messaging.onBackgroundMessage((payload) => {
  console.log('Received background SOS', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon512_maskable.png',
    badge: '/icon512_maskable.png',
    vibrate: [500, 250, 500, 250, 500], // Makes the phone buzz urgently
    requireInteraction: true, // Keeps the notification on screen until tapped
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});