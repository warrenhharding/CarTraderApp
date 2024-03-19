document.addEventListener('DOMContentLoaded', function() {
  const menuIcon = document.getElementById('hamburgerMenu');
  const dropdownContent = document.getElementById('hamburgerDropdown');

  menuIcon.addEventListener('click', function() {
      // Toggle menu visibility based on the display property
    //   console.log("dropdownContent.style.display: ", dropdownContent.style.display);
      if (dropdownContent.style.display === 'block') {
        //   console.log("About to close the dropdown");
          dropdownContent.style.display = 'none';
        //   console.log("dropdownContent.style.display: ", dropdownContent.style.display);
      } else {
        //   console.log("About to display the dropdown");
          dropdownContent.style.display = 'block';
        //   console.log("dropdownContent.style.display: ", dropdownContent.style.display);
      }
  });

  // Additionally, to close the dropdown when any item within it is clicked:
  const dropdownItems = dropdownContent.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
      item.addEventListener('click', function() {
          // Hide the dropdown menu
          dropdownContent.style.display = 'none';
      });
  });
});



function updateMenuBasedOnAuth() {
    console.log("Running menu update...");
    const signInSignUpMenu = document.getElementById('signInSignUpMenu');
    const logoutMenuItem = document.getElementById('logoutMenuItem');
    const makePaymentMenuItem = document.getElementById('makePaymentMenuItem');
    const subscriptionStatusMenuItem = document.getElementById('subscriptionStatusMenuItem');
    const enableNotificationsMenuItem = document.getElementById('enableNotificationsMenuItem');
    const viewAdsDashboardMenuItem = document.getElementById('viewAdsDashboardMenuItem');
    const dropdownContent = document.getElementById('hamburgerDropdown');

    const uploadCarButton = document.getElementById('uploadCarButton');
    const addNewCarMake = document.getElementById('addNewCarMake');


    const user = firebase.auth().currentUser; // Directly check the current user
    if (user) {
        // User is logged in, update the UI accordingly
        if (signInSignUpMenu) signInSignUpMenu.style.display = 'none';
        accountDetailsMenuItem.style.display = 'block';
        subscriptionStatusMenuItem.style.display = 'block';
        // Assume `subscriptionActive` is a variable that holds subscription status
        if (!subscriptionActive) {
            makePaymentMenuItem.style.display = 'block';
            if (messagingSupported) {
                enableNotificationsMenuItem.style.display = 'none';
            }
        } else {
            makePaymentMenuItem.style.display = 'none';
            if (messagingSupported) {
                enableNotificationsMenuItem.style.display = 'block';
            }
        }
        viewAdsDashboardMenuItem.style.display = 'block';
        logoutMenuItem.style.display = 'block';
        dropdownContent.style.display = 'none';

        uploadCarButton.style.display = 'block';
        addNewCarMake.style.display = 'block';
        // Additional logic here if needed
    } else {
        // User is not logged in, update the UI to reflect this
        if (signInSignUpMenu) signInSignUpMenu.style.display = 'block';
        accountDetailsMenuItem.style.display = 'none';
        subscriptionStatusMenuItem.style.display = 'none';
        makePaymentMenuItem.style.display = 'none';
        enableNotificationsMenuItem.style.display = 'none';
        viewAdsDashboardMenuItem.style.display = 'none';
        logoutMenuItem.style.display = 'none';
        dropdownContent.style.display = 'none';
        // Additional logic here if needed

        uploadCarButton.style.display = 'none';
        addNewCarMake.style.display = 'none';
    }
}


function openAuthModal() {
    console.log("Opening the authentication modal...");
    // Define the modal using Bootstrap's Modal component
    var authModal = new bootstrap.Modal(document.getElementById('authModal'), {
        keyboard: false
    });

    // Add event listener for when the modal is fully shown
    document.getElementById('authModal').addEventListener('shown.bs.modal', function () {
        console.log("Modal is fully visible. Running setGoogleSignInButtonWidth...");
        setGoogleSignInButtonWidth();
    });

    // Show the modal
    setTimeout(function () {
        authModal.show();
    }, 400);
}

  
  





function updateUserUI(user) {
    // console.log("updateUserUI has just been called...");
    const welcomeMessage = document.getElementById('welcomeMessage');
    const userPhoto = document.getElementById('userPhoto');
    const userInfoContainer = document.getElementById('userInfoContainer');

    if (user) {
        // User is signed in
        // console.log("displayName, email: ", user.displayName, user.email);
        let displayName = user.displayName;
        // Check if displayName is null or undefined and use email if so
        if (displayName === null || displayName === undefined) {
            displayName = user.email;
        }
        // console.log("We've settled on: ", displayName);
        welcomeMessage.innerText = `Welcome Back ${displayName}`;
        welcomeMessage.style.display = 'block';
    
        // Create a new image element
        const userPhoto = new Image();
    
        // Set an onload event handler to check if the photoURL was loaded
        userPhoto.onload = function() {
            // The image was loaded successfully
            userPhoto.alt = 'User Photo';
            userPhoto.style.display = 'inline'; // Show the user photo
        };
    
        // Set an onerror event handler to handle the case where the photoURL fails to load
        userPhoto.onerror = function() {
            // The image failed to load, hide the user photo element
            userPhoto.style.display = 'none';
        };
    
        // Set the src attribute to the user's photoURL
        userPhoto.src = user.photoURL;
    
        userInfoContainer.style.display = 'flex'; // Show the user info container
        // You can also show additional user-specific content or links here.
    } else {
        // User is signed out
        userInfoContainer.style.display = 'none'; // Hide the user info container
    }
}


function showAccountDetails() {
    var myModal = new bootstrap.Modal(document.getElementById('userProfileModal'), {
        keyboard: false
    });
    myModal.show();
    
    const user = firebase.auth().currentUser;
    // console.log("user: ", user);
    if (user) {
        prePopulateModal(user.uid);
        // Code to open the modal goes here
    }
}


  function formatDate(dateStr) {
    // Convert YYYYMMDD to DD/MM/YYYY
    return dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$3/$2/$1');
  }

  
  function formatTimestamp(timestamp) {
    // Convert timestamp to readable date in DD/MM/YYYY, HH:MM format for Ireland locale
    const date = new Date(timestamp);
    return date.toLocaleString('en-IE', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', '');
  }



function logUserOut() {
    // console.log("Logging user out...");
    firebase.auth().signOut()
        .then(() => {
            // console.log("User logged out...");
            const welcomeMessage = document.getElementById('welcomeMessage');
            welcomeMessage.innerText = `Welcome to Trader App`;
            const userPhoto = document.getElementById('userPhoto');
            const userInfoContainer = document.getElementById('userInfoContainer');
            // welcomeMessage.style.display = 'none';
            userPhoto.style.display = 'none';
            // userInfoContainer.style.display = 'none';

        })
        .catch((error) => {
            console.error("Error during sign out: ", error);
        });
}


function ensureUUID() {
  // Check if the UUID already exists in localStorage
  let uuid = localStorage.getItem('UUID');
  
  if (!uuid) {
      // Generate a new UUID
      uuid = generateUUID();
      // Store the new UUID in localStorage
      localStorage.setItem('UUID', uuid);
  }
  
  console.log('UUID:', uuid);
  return uuid;
}

function generateUUID() {
  // Generate a simple UUID (version 4 like)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
  });
}
