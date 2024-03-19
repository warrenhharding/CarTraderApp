// firebase-messaging-sw.js

// Import the Firebase scripts needed for Firebase Messaging
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');


const firebaseConfig = {
    apiKey: "AIzaSyBTl8bGtVNvRdh2qdWmHnbDu6zuJcuTpAQ",
    authDomain: "cartraderappirl.firebaseapp.com",
    databaseURL: "https://cartraderappirl-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "cartraderappirl",
    storageBucket: "cartraderappirl.appspot.com",
    messagingSenderId: "231763549741",
    appId: "1:231763549741:web:7412b4ec7e17f37d76e2a4",
    measurementId: "G-L08G9B2Z08"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);


const messaging = firebase.messaging();

// Optional:
// Add background message handler:
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
  const payload = event.data;
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
      body: payload.notification.body,
      icon: payload.notification.icon,
      // Other options as needed
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});



