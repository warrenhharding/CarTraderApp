document.addEventListener('DOMContentLoaded', function() {
    const menuIcon = document.getElementById('hamburgerMenu');
    let dropdownContent = document.querySelector('.dropdown-content');

    menuIcon.addEventListener('click', function() {
      if (!dropdownContent || getComputedStyle(dropdownContent).display === 'none') {
        // Load the menu content if it hasn't been loaded yet or if it's hidden
        fetch('menu.html')
          .then(response => response.text())
          .then(html => {
            menuIcon.insertAdjacentHTML('afterend', html);
            // Now that it's loaded, toggle visibility
            const dropdownContent = document.querySelector('.dropdown-content');
            dropdownContent.style.display = dropdownContent.style.display === 'none' ? 'block' : 'none';
        })
          .catch(error => {
            console.error('Error loading the menu:', error);
          });
      } else {
        // Toggle menu visibility based on the display property
        dropdownContent.style.display = 'none';
      }
    });
  });


  document.addEventListener('DOMContentLoaded', function() {
    const signInSignUpMenu = document.getElementById('signInSignUpMenu');
    const logoutMenuItem = document.getElementById('logoutMenuItem');
    // const accountDetailsMenuItem = document.getElementById('accountDetailsMenuItem');
    const dropdownContent = document.getElementById('hamburgerDropdown');
    // const previousPurchasesMenuItem = document.getElementById('previousPurchasesMenuItem');
  
    // Check the user's authentication status
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // User is logged in, hide the Sign In / Sign Up menu item
        if (signInSignUpMenu) signInSignUpMenu.style.display = 'none';
        logoutMenuItem.style.display = 'block';
        dropdownContent.style.display = 'none';

      } else {
        // User is not logged in, show the Sign In / Sign Up menu item
        if (signInSignUpMenu) signInSignUpMenu.style.display = 'block';
        logoutMenuItem.style.display = 'none';
        dropdownContent.style.display = 'none';
      }
    });
  
        // Function to open the authentication modal
        window.openAuthModal = function() {
            console.log("Opening the authmodal from here...");
            document.getElementById("authModal").style.visibility = "hidden";
            $('#authModal').modal('show'); // Using jQuery to show the Bootstrap modal
        };

        $('#authModal').on('shown.bs.modal', function () {
            // Calculate and set the Google Sign-In button width when the modal is fully open
            console.log("Opening the authmodal from there...");
            setGoogleSignInButtonWidth();
            setTimeout(function () {
                document.getElementById("authModal").style.visibility = "visible";
            }, 400);
        });
    });


  
  




  document.addEventListener('DOMContentLoaded', function() {
    // console.log('DOM fully loaded and parsed');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const dropdownContent = document.getElementById('hamburgerDropdown');

    if (!hamburgerMenu || !dropdownContent) {
        console.error('Hamburger menu or dropdown content not found!');
        return; // Exit if elements are not found
    }

    // Toggle the dropdown visibility
    hamburgerMenu.addEventListener('click', function(event) {
        // console.log('Hamburger menu clicked');
        event.stopPropagation(); // Prevent clicks from being captured outside
        const isVisible = dropdownContent.style.display === 'block';
        dropdownContent.style.display = isVisible ? 'none' : 'block';
        // console.log('Dropdown visibility toggled. Display:', dropdownContent.style.display);
    });

    // Close the dropdown when clicking anywhere outside the dropdown and the hamburger menu
    document.addEventListener('click', function(event) {
        // console.log('Document clicked');
        if (!hamburgerMenu.contains(event.target) && !dropdownContent.contains(event.target)) {
            // console.log('Click outside hamburger menu and dropdown content');
            dropdownContent.style.display = 'none';
            // console.log('Dropdown should now be hidden. Display:', dropdownContent.style.display);
        }
    });

    // Prevent the dropdown from closing when clicking inside the dropdown
    dropdownContent.addEventListener('click', function(event) {
        // console.log('Click inside dropdown content');
        event.stopPropagation();
    });
});


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
    const accountDetailsModal = new bootstrap.Modal(document.getElementById('accountDetailsModal'));
        accountDetailsModal.show();

        // Retrieve user details and populate the form
        const user = firebase.auth().currentUser;
        if (user) {
            const accountDetailsForm = document.getElementById('accountDetailsForm');
            const firstNameInput = document.getElementById('firstName');
            const surnameInput = document.getElementById('surname');
            const phoneNumberInput = document.getElementById('phoneNumber');
            const accountEmailAddressInput = document.getElementById('accountEmailAddress');
            const signupDateInput = document.getElementById('signupDate');
            const originalEmailVerifiedInput = document.getElementById('emailVerified');

            // Initialize variables to store user details
            let originalFirstName = user.displayName || '';
            let originalSurname = ''; // You can populate this from Firebase if available
            let originalPhoneNumber = ''; // You can populate this from Firebase if available
            let originalAccountEmailAddress = ''; // You can populate this from Firebase if available
            let originalSignupDate = ''; // You can populate this from Firebase if available
            let originalEmailVerified = ''; // You can populate this from Firebase if available
            let formattedDate;

            // Reference to the user's data in the database
            const userRef = firebase.database().ref('users/' + user.uid);

            // Retrieve user data from the database
            userRef.once('value')
                .then((snapshot) => {
                    const userData = snapshot.val();
                    if (userData) {
                        originalFirstName = userData.firstName || '';
                        originalSurname = userData.surname || '';
                        originalPhoneNumber = userData.phoneNumber || '';
                        originalAccountEmailAddress = userData.email;
                        originalEmailVerified = userData.emailVerified || '';
                        
                        // Initialize formattedDate to a default value (e.g., 'Not available')
                        let formattedDate = 'Not available';
                    
                        if (user.signupDate !== null) {
                            const signupDateTimestamp = userData.signupDate * 1000;
                            // console.log("user.uid: ", user.uid)
                            // console.log("userData.signupDate: ", userData.signupDate)
                            
                            if (!isNaN(signupDateTimestamp)) { // Check if it's a valid timestamp
                                originalSignupDate = new Date(signupDateTimestamp);
                                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                                formattedDate = originalSignupDate.toLocaleDateString('en-IE', options);
                            } else {
                                console.error('Invalid timestamp:', user.signupDate);
                            }  
                        } else {
                            console.error('Signup date is null.');
                        }
                    
                        // Debugging: Log values for inspection
                        // console.log('originalFirstName:', originalFirstName);
                        // console.log('originalSurname:', originalSurname);
                        // console.log('originalPhoneNumber:', originalPhoneNumber);
                        // console.log('originalAccountEmailAddress:', originalAccountEmailAddress);
                        // console.log('formattedDate:', formattedDate);

                        if (originalEmailVerified) {
                            originalEmailVerified = "Yes";
                        } else if (!originalEmailVerified) {
                            originalEmailVerified = "No";
                        }
                    
                        // Populate the form with user details
                        firstNameInput.value = originalFirstName;
                        surnameInput.value = originalSurname;
                        phoneNumberInput.value = originalPhoneNumber;
                        accountEmailAddressInput.value = originalAccountEmailAddress;
                        signupDateInput.value = formattedDate;
                        originalEmailVerifiedInput.value = originalEmailVerified;
                    }
                })
                .catch((error) => {
                    console.error("Error retrieving user data: ", error);
                });

            // Handle form submission
            accountDetailsForm.addEventListener('submit', function(event) {
                event.preventDefault();

                // Get updated user details from the form
                const updatedFirstName = firstNameInput.value;
                const updatedSurname = surnameInput.value;
                const updatedPhoneNumber = phoneNumberInput.value;

                // Check if there are changes
                if (
                    updatedFirstName !== originalFirstName ||
                    updatedSurname !== originalSurname ||
                    updatedPhoneNumber !== originalPhoneNumber
                ) {
                    // Create an object to store updated details
                    const updatedDetails = {
                        firstName: updatedFirstName,
                        surname: updatedSurname,
                        phoneNumber: updatedPhoneNumber,
                        displayName: updatedFirstName,
                        fullName: updatedFirstName + " " + updatedSurname,
                        // Add other fields as needed
                    };

                    // Update user details in Firebase Realtime Database
                    userRef.update(updatedDetails)
                        .then(() => {
                            // Successfully updated user details in Firebase
                            // Also update the original values with the new values
                            originalFirstName = updatedFirstName;
                            originalSurname = updatedSurname;
                            originalPhoneNumber = updatedPhoneNumber;

                            // Update user.displayName to match updated firstName
                            user.updateProfile({
                                displayName: updatedFirstName
                            }).then(() => {
                                // Successfully updated user.displayName
                                console.error("Successfully updated user.displayName: ", user.displayName);
                            }).catch((error) => {
                                console.error("Error updating user.displayName: ", error);
                            });

                            const welcomeMessage = document.getElementById('welcomeMessage');
                            welcomeMessage.innerText = `Welcome back ${updatedFirstName}`;

                            // Close the modal
                            accountDetailsModal.hide();
                        })
                        .catch((error) => {
                            console.error("Error updating user details in Firebase: ", error);
                        });
                } else {
                    // No changes, close the modal
                    accountDetailsModal.hide();
                }
            });
        };
}


async function showPreviousPurchases() {
    const userId = firebase.auth().currentUser.uid; // Get current user ID
    const purchasesRef = firebase.database().ref(`users/${userId}/eventsPurchased`);
  
    try {
      const snapshot = await purchasesRef.once('value');
      const purchases = snapshot.val();
      const purchasesList = document.getElementById('purchasesList');
      purchasesList.innerHTML = ''; // Clear existing list
  
      if (!purchases) {
        // If there are no purchases, show an alert
        alert("No previous bookings found.");
      } else {
        // If there are purchases, proceed to list them
        Object.keys(purchases).forEach(key => {
            const purchase = purchases[key];
            const formattedDate = formatDate(purchase.date); // Convert YYYYMMDD to DD/MM/YYYY
            const formattedTimestamp = formatTimestamp(purchase.paidTimestamp); // Convert timestamp to readable date/time
          
            // Create a new list item for each purchase with each item in its own row
            const listItem = document.createElement('div');
            listItem.classList.add('list-group-item', 'purchase-item'); // Added 'purchase-item' for additional styling
            listItem.innerHTML = `
              <div><strong class="text-orange">Date of Event:</strong> ${formattedDate}</div>
              <div><strong class="text-orange">Description:</strong> ${purchase.description}</div>
              <div><strong class="text-orange">Participants:</strong> ${purchase.numParticipants}</div>
              <div><strong class="text-orange">Paid On:</strong> ${formattedTimestamp}</div>
              <div><strong class="text-orange">Total Price:</strong> €${purchase.totalPrice}</div>
            `;
            purchasesList.appendChild(listItem);
          });
  
        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('previousPurchasesModal'));
        modal.show();
      }
    } catch (error) {
      console.error("Error fetching previous purchases:", error);
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
    firebase.auth().signOut()
        .then(() => {
            const welcomeMessage = document.getElementById('welcomeMessage');
            welcomeMessage.innerText = `Welcome to Date Roulette`;
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
