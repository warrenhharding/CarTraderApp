



function setupEnableNotifications() {
    console.log("Running setupEnableNotifications()...");
    if (!messagingSupported) {
      console.log('Messaging is not supported');
      return;
    }
  
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('No user logged in when looking at messaging.');
      return;
    }
  
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/firebase-messaging-sw.js').then(() => {
            console.log('Service worker registered.');
            return navigator.serviceWorker.ready;
          }).then(() => {
            getTokenWithRetry();
          }).catch(err => console.error('Service worker registration failed:', err));
        }
      } else {
        console.log('Notification permission not granted.');
        updateUIForDisabledNotifications();
      }
    });
  }
  
  function getTokenWithRetry(attemptsLeft = 5, delay = 400) {
    messaging.getToken({vapidKey: 'BJ-lxnA85P3WwnUzRDSxeOK7KZQuozOZ0kimTSzbKDw0p7btIw_EtjFqpYruoKaYft90gpHd2ecC7BgPvZth5L8'}).then(currentToken => {
      if (currentToken) {
        console.log('Token retrieved:', currentToken);
        handleTokenRefresh(currentToken);
      } else {
        console.log('No registration token available. Request permission to generate one.');
      }
    }).catch(err => {
      console.error('Error retrieving token:', err);
      if (attemptsLeft > 1) {
        console.log(`Retrying getToken in ${delay}ms...`);
        setTimeout(() => getTokenWithRetry(attemptsLeft - 1, delay * 2), delay);
      }
    });
  }
  
  function handleTokenRefresh(currentToken) {
    const deviceUUID = ensureUUID(); // Ensure a UUID for this device exists
    const userRef = firebase.database().ref(`users/${firebase.auth().currentUser.uid}`);
    const tokensRef = userRef.child('tokens');
  
    tokensRef.child(deviceUUID).once('value').then((snapshot) => {
      const storedToken = snapshot.val();
      if (storedToken !== currentToken) {
        tokensRef.child(deviceUUID).set(currentToken).then(() => {
          console.log('Token updated in the database for device:', deviceUUID);
          updateUIForEnabledNotifications();
        }).catch(error => console.error('Failed to update token:', error));
      } else {
        console.log('Existing token is valid.');
        updateUIForEnabledNotifications();
      }
    });
  }


  function updateUIForEnabledNotifications() {
    // Update UI to indicate that notifications are enabled
    document.getElementById('enableNotificationsMenuItem').innerText = 'Notifications Enabled - Click to Unsubscribe';
    document.getElementById('enableNotificationsMenuItem').onclick = unsubscribeFromNotifications;
    document.getElementById('enableNotificationsMenuItem').style.display = '';
    document.getElementById('enableNotificationsMenuItem').style.color = "green";
  }
  
  function updateUIForDisabledNotifications() {
    // Update UI for enabling notifications
    document.getElementById('enableNotificationsMenuItem').innerText = 'Enable Notifications';
    document.getElementById('enableNotificationsMenuItem').onclick = enableNotifications; // Ensure this function calls setupEnableNotifications again
    document.getElementById('enableNotificationsMenuItem').style.display = '';
    document.getElementById('enableNotificationsMenuItem').style.color = "black";
  }