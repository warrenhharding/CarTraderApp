var database = firebase.database();
const auth = firebase.auth();
const functions = firebase.functions();
const storage = firebase.storage();
let subscriptionActive = false;
let carMakesArray = [];
let messaging;
let messagingSupported = false;
let favouriteListings = [];
var allListings = [];

if (isMessagingSupported()) {
  messaging = firebase.messaging();
  messaging.usePublicVapidKey('BJ-lxnA85P3WwnUzRDSxeOK7KZQuozOZ0kimTSzbKDw0p7btIw_EtjFqpYruoKaYft90gpHd2ecC7BgPvZth5L8');
  messagingSupported = true;
  // console.log('Firebase Messaging IS supported in this browser.');
} else {
  // console.log('Firebase Messaging is NOT supported in this browser.');
}

if (messagingSupported && messaging) {
  // Handle incoming messages. Called when:
  messaging.onMessage((payload) => {
    console.log('Message received. ', payload);
    // Send a message to the service worker to display a notification
    navigator.serviceWorker.ready.then((registration) => {
      registration.active.postMessage(payload);
    });
  });
}

function throttle(func, limit) {
  let lastFunc;
  let lastRan;
  return function() {
      const context = this;
      const args = arguments;
      if (!lastRan) {
          func.apply(context, args);
          lastRan = Date.now();
      } else {
          clearTimeout(lastFunc);
          lastFunc = setTimeout(function() {
              if ((Date.now() - lastRan) >= limit) {
                  func.apply(context, args);
                  lastRan = Date.now();
              }
          }, limit - (Date.now() - lastRan));
      }
  }
}


// Check if a user is signed in
firebase.auth().onAuthStateChanged((user) => {
    updateMenuBasedOnAuth();
    setupEnableNotifications();
    if (user) {
        // console.log("User signed in is ", user.email);
        // User is signed in
        updateUserUI(user);
        // Reference to the user's data in the Realtime Database
        checkSubscriptionStatus();
        var userRef = firebase.database().ref('users/' + user.uid);

        // Fetch the user's data from the Realtime Database
        userRef.once('value').then((snapshot) => {
            const userData = snapshot.val();

            if (userData) {
                if ('emailVerified' in userData) {
                    if (!userData.emailVerified) {
                        // Additional check for user's email verification status with Firebase Auth
                        if (user.emailVerified) {
                            // Update the emailVerified field in the Realtime Database
                            userRef.update({ emailVerified: true })
                                .then(() => console.log('Email verification status updated in the database.'))
                                .catch((error) => console.error('Failed to update email verification status:', error));
                        }
                    }
                } else {
                    // Handle the case where emailVerified does not exist
                    // console.log('emailVerified field does not exist.');

                    // Optionally, update or handle this scenario as needed
                    if (user.emailVerified) {
                        userRef.update({ emailVerified: true })
                            .then(() => console.log('Email verification status initialized in the database.'))
                            .catch((error) => console.error('Failed to initialize email verification status:', error));
                    }
                }

                // setupEnableNotifications();
                
              
            } else {
                // console.error('No user data found in the database.');
            }
        });
    } else {
        subscriptionActive = false;
        const statusIndicator = document.getElementById('subscriptionStatusIndicator');
        statusIndicator.textContent = 'Subscription not currently active';
        statusIndicator.style.display = 'none';
        statusIndicator.style.color = red;
    }
});



const throttledSetupEnableNotifications = throttle(function() {
  setupEnableNotifications()
  console.log('Function runs at most once every minute');
}, 60000);


// Log out user on page load
// firebase.auth().signOut().then(() => {
//     // console.log("User signed out.");
//   }).catch((error) => {
//     console.error("Error signing out: ", error);
//   });


function getUserSignInStatus() {
  return new Promise((resolve, reject) => {
      const unsubscribe = firebase.auth().onAuthStateChanged(user => {
          unsubscribe(); // Unsubscribe to avoid memory leaks
          resolve(user); // Resolve the promise with the user object (or `null` if not signed in)
      }, reject); // Reject the promise on error
  });
}


$(document).ready(function() {
    const emailAuthButton = document.getElementById("emailAuthButton");
    emailAuthButton.addEventListener("click", () => {
        // console.log("Email auth button clicked");
        const email = document.getElementById("userEmail").value;
        const password = document.getElementById("userPassword").value;

        // Set the persistence to LOCAL before starting the auth process
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                // Sign in or sign up logic
                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        // Signed in
                        handleEmailPasswordUser(userCredential.user);
                    })
                    .catch((error) => {
                        // console.log("error: ", error);
                        let errorMessage = "We seem to be having a problem logging you in. Please try again and if the problem is not resolved please send us an email at help@dateroulette.ie and we'll help get you logged in.";

                        switch(error.code) {
                            case 'auth/email-already-in-use':
                                // Email already in use, try signing in
                                auth.signInWithEmailAndPassword(email, password)
                                    .then((userCredential) => {
                                        handleEmailPasswordUser(userCredential.user);
                                    })
                                    .catch((signInError) => {
                                        console.error("Error during Email/Password Sign-In: ", signInError);
                                        let signInErrorMessage = "We seem to be having a problem logging you in. Please check your email and password and try again.";
                                        if(signInError.code === 'auth/wrong-password') {
                                            signInErrorMessage = "The password you entered is incorrect. Please try again.";
                                        } else if(signInError.code === 'auth/user-not-found') {
                                            signInErrorMessage = "No user found with this email. Please sign up.";
                                        } // Include other signInError codes as needed
                                        // Display the error message within the modal
                                        authModalMessage.textContent = signInErrorMessage;
                                    });
                                break;
                            case 'auth/wrong-password':
                                // This case might only be reached if there's a logic path not covered above, considering our attempt to sign in on 'email already in use'
                                authModalMessage.textContent = "The password you entered is incorrect. Please try again.";
                                break;
                            case 'auth/user-not-found':
                                authModalMessage.textContent = "No user found with this email. Please sign up.";
                                break;
                            case 'auth/internal-error':
                                authModalMessage.textContent = "There was an error in signin. Please check your login details and try again.";
                                break;
                            case 'auth/too-many-requests':
                                authModalMessage.textContent = "Too many failed login attempts. Please try again later.";
                                break;
                            // Include other error codes as needed
                        }

                        if(error.code !== 'auth/email-already-in-use') {
                            // Update the modal message directly
                            authModalMessage.textContent = errorMessage;
                            console.error("Error during Email/Password Sign-Up: ", error);
                        }
                    });
            })
            .catch((error) => {
                console.error("Error setting persistence: ", error);
                // It could be useful to also display this error in a user-friendly way
            });
    });
});


document.addEventListener('DOMContentLoaded', function() {
    ensureUUID();
    updateMenuBasedOnAuth();

    fetchCarMakes();

    var myModal = new bootstrap.Modal(document.getElementById('carUploadModal'), {
        keyboard: false
    });

    document.getElementById('uploadCarButton').addEventListener('click', function () {
        var topBarHeight = document.querySelector('.top-bar').offsetHeight;
        document.querySelector('.modal-dialog').style.paddingTop = topBarHeight + 'px';
        myModal.show();
    });

    var adManagementModalEl = document.getElementById('adManagementModal');
    var adManagementModal = bootstrap.Modal.getInstance(adManagementModalEl); // Get the modal instance

    adManagementModalEl.addEventListener('hidden.bs.modal', function () {
        var backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(function(backdrop) {
            backdrop.remove();
        });
        document.body.classList.remove('modal-open'); // Remove this class only if there are no more modals open
        if (!document.querySelector('.modal.show')) {
            document.body.style.overflow = ''; // Restore scrolling
            document.body.style.paddingRight = ''; // Remove padding if added by modal
        }
    });
});



document.getElementById('carUploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Assuming you've initialized Firebase
    const user = firebase.auth().currentUser; // Get the current user
    if (!user) {
        alert("You must be logged in to upload a car for sale.");
        return;
    }

    // Assuming Firebase has been initialized
    const storageRef = firebase.storage().ref();
    const carListingsRef = firebase.database().ref('currentCarListings');

    const formData = {
        make: document.getElementById('carMake').value,
        model: document.getElementById('carModel').value,
        price: document.getElementById('carPrice').value,
        year: document.getElementById('carYear').value,
        county: document.getElementById('carCounty').value,
        colour: document.getElementById('carColour').value || 'N/A', // Handle optional fields
        mileage: document.getElementById('carMileage').value || 'N/A',
        nct: document.getElementById('carNCT').value || 'N/A',
        details: document.getElementById('carDetails').value || 'N/A',
        seller: user.uid,
        timestamp: Date.now(),
        paymentStatus: "paymentPending",
        images: [] // This will be populated with the URLs of the uploaded images
    };

    const files = document.getElementById('carImages').files;
    if (files.length > 6) {
        alert('You can only upload up to 6 images.');
        return;
    }

    const compressedImagesPromises = [];
    for (let i = 0; i < files.length; i++) {
        compressedImagesPromises.push(
            new Promise((resolve, reject) => {
                new Compressor(files[i], {
                    quality: 0.6,
                    success(result) {
                        const imageRef = storageRef.child(`carImages/${result.name}`);
                        imageRef.put(result).then(snapshot => snapshot.ref.getDownloadURL())
                            .then(url => resolve(url))
                            .catch(err => reject(err));
                    },
                    error(err) {
                        reject(err);
                    },
                });
            })
        );
    }

    Promise.all(compressedImagesPromises).then(urls => {
        formData.images = urls;
        const newCarListingRef = carListingsRef.push();
        newCarListingRef.set(formData).then(() => {
            alert('Car listed successfully!');
            document.getElementById('carUploadForm').reset();
            // Optionally, reset the form or close the modal here

            var closeButton = document.querySelector('#carUploadModal .btn-close');
            closeButton.click();

        }).catch(error => {
            console.error('Error listing car:', error);
            alert('Failed to list the car.');
        });
    }).catch(error => {
        console.error('Error compressing or uploading images:', error);
        alert('Failed to compress or upload some images.');
    });
});
  




function loadUserAds(listingType) {
  // console.log(`Opening ${listingType} ads dashboard`);
  const user = firebase.auth().currentUser;
  if (user) {
    // Define paths based on listing type
    const listingsPath = listingType === 'current'
      ? `/users/${user.uid}/currentListings`
      : `/users/${user.uid}/archivedListings`;
    const adsRef = firebase.database().ref(listingsPath);
    adsRef.once('value').then((snapshot) => {
      const adsTableBody = document.getElementById('adsTableBody');
      adsTableBody.innerHTML = ''; // Clear existing rows
      // Adjust the table headers based on the listing type
      const tableHead = document.querySelector('#adManagementModal .table thead');
      if (listingType === 'current') {
          tableHead.innerHTML = `
              <tr>
                  <th scope="col">Date Created</th>
                  <th scope="col">Make</th>
                  <th scope="col">Model</th>
                  <th scope="col">Colour</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col">Pay Now</th>
                  <th scope="col">Archive</th>
              </tr>`;
      } else { // Archived listings
          tableHead.innerHTML = `
              <tr>
                  <th scope="col">Date Created</th>
                  <th scope="col">Make</th>
                  <th scope="col">Model</th>
                  <th scope="col">Colour</th>
                  <th scope="col">Price</th>
                  <th scope="col">Status</th>
                  <th scope="col">Unarchive</th>
              </tr>`;
      }

      let adCount = 0;
      
      snapshot.forEach((childSnapshot) => {
        const ad = childSnapshot.val();
        
        // Convert Unix timestamp to Date object and format it for the Irish locale
        const adDate = new Date(ad.timestamp).toLocaleDateString('en-IE', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });

        const tr = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.setAttribute('data-label', 'Date Created'); 
        dateCell.textContent = adDate; 
        tr.appendChild(dateCell);

        const makeCell = document.createElement('td');
        makeCell.setAttribute('data-label', 'Make');
        makeCell.textContent = ad.make; 
        tr.appendChild(makeCell);

        const modelCell = document.createElement('td');
        modelCell.setAttribute('data-label', 'Model');
        modelCell.textContent = ad.model; 
        tr.appendChild(modelCell);

        const colourCell = document.createElement('td');
        colourCell.setAttribute('data-label', 'Colour');
        colourCell.textContent = ad.colour; 
        tr.appendChild(colourCell);

        const priceCell = document.createElement('td');
        priceCell.setAttribute('data-label', 'Price');
        priceCell.textContent = ad.price; 
        tr.appendChild(priceCell);

        const paymentStatusCell = document.createElement('td');
        paymentStatusCell.setAttribute('data-label', 'Status');
        paymentStatusCell.textContent = ad.paymentStatus === 'paid' || listingType === 'archived' ? 'Paid' : 'Unpaid'; 
        tr.appendChild(paymentStatusCell);

        let payNowCell = document.createElement('td');
        payNowCell.setAttribute('data-label', 'Pay Now');

        // Depending on your condition, you might populate it differently
        if (ad.paymentStatus !== 'paid' && listingType === "current") {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.classList.add('form-check-input', 'pay-now-checkbox');
            input.setAttribute('data-ad-id', childSnapshot.key); // Assuming childSnapshot.key exists in your context
            payNowCell.appendChild(input);
        } else {
            payNowCell.classList.add('hide-on-mobile');
            payNowCell.textContent = ''; // or whatever is appropriate in this case
        }
        tr.appendChild(payNowCell);

        let archiveCell = document.createElement('td');
        archiveCell.setAttribute('data-label', 'Archive');

        // Assuming 'ad' represents an ad object and you're inside a loop or function creating table rows
        if (listingType === 'current') {
            let archiveButton = document.createElement('button');
            archiveButton.classList.add('btn', 'btn-sm', 'btn-warning', 'archive-ad-button');
            archiveButton.setAttribute('data-ad-id', childSnapshot.key); // Adjust based on your actual key
            archiveButton.textContent = 'Archive';
            
            // Optionally, add an event listener to your button for functionality
            archiveButton.addEventListener('click', function() {
                // Archive functionality here
            });

            archiveCell.appendChild(archiveButton);
        }

        if (listingType === 'archived') {
            let unarchiveButton = document.createElement('button');
            unarchiveButton.classList.add('btn', 'btn-sm', 'btn-info', 'unarchive-ad-button');
            unarchiveButton.setAttribute('data-ad-id', childSnapshot.key); // Adjust based on your actual key
            unarchiveButton.textContent = 'Unarchive';
            
            // Optionally, add an event listener to your button for functionality
            unarchiveButton.addEventListener('click', function() {
                // Unarchive functionality here
            });
        
            archiveCell.appendChild(unarchiveButton);
        }

        tr.appendChild(archiveCell);

        adsTableBody.appendChild(tr);
      });

      



      // Fetch the number of free ads available for the user and update the message box
      const freeAdsRef = firebase.database().ref(`users/${user.uid}/freeAdsAvailable`);
      freeAdsRef.once('value').then((freeAdsSnapshot) => {
          const freeAdsAvailable = freeAdsSnapshot.val();
          const freeAdsMessageBox = document.getElementById('freeAdsMessageBox');

          if (freeAdsAvailable > 0) {
            if (freeAdsAvailable === 1) {
              freeAdsMessageBox.textContent = `You have ${freeAdsAvailable} free ad remaining.`;
              freeAdsMessageBox.style.display = 'block'; // Show the message box
            } else {
              freeAdsMessageBox.textContent = `You have ${freeAdsAvailable} free ads remaining.`;
              freeAdsMessageBox.style.display = 'block'; // Show the message box
            } 
          } else {
              freeAdsMessageBox.style.display = 'none'; // Hide the message box
          }
      }).catch((error) => {
          console.error(`Error fetching free ads available:`, error);
      });

      // Toggle buttons to reflect the active listing type
      document.getElementById('currentListingsButton').disabled = (listingType === 'current');
      document.getElementById('archivedListingsButton').disabled = (listingType === 'archived');

      // Attach event listeners for the new buttons
      attachButtonListeners(listingType);

      var adManagementModal = new bootstrap.Modal(document.getElementById('adManagementModal'), {
          keyboard: false
      });
      adManagementModal.show();
      
    }).catch((error) => {
      console.error(`Error loading ${listingType} ads:`, error);
    });
  }
}


function attachButtonListeners(listingType) {
    const adsTableBody = document.getElementById('adsTableBody');
    adsTableBody.querySelectorAll('.archive-ad-button').forEach(button => {
        button.addEventListener('click', function() {
            const adId = this.getAttribute('data-ad-id');
          archiveAd(adId);
        // Optionally, you can remove the ad row from the table or reload the ads to reflect the changes
      });
    });

    adsTableBody.querySelectorAll('.unarchive-ad-button').forEach(button => {
    button.addEventListener('click', function() {
    const adId = this.getAttribute('data-ad-id');
    unarchiveAd(adId);
    // Optionally, you can remove the ad row from the table or reload the ads to reflect the changes
    });
    });

    if (listingType === 'current') {
      let selectedAds = [];
      adsTableBody.querySelectorAll('.pay-now-checkbox').forEach(checkbox => {
          checkbox.addEventListener('change', function() {
              const adId = this.getAttribute('data-ad-id');
              if (this.checked) {
                  selectedAds.push(adId);
              } else {
                  selectedAds = selectedAds.filter(id => id !== adId);
              }
              // Enable the Pay Now button if at least one ad is selected
              document.getElementById('payNowButton').disabled = selectedAds.length === 0;
          });
      });

      // Pay Now Button event listener
      document.getElementById('payNowButton').addEventListener('click', function() {
        // console.log("selectedAds: ", selectedAds);
          processPayment(selectedAds);
      });
    }
}


// This function is just a placeholder for the payment process.
// You will need to implement the actual payment processing logic.
function processPayment(selectedAds) {
    showSpinner();
    document.getElementById('payNowButton').disabled = true;
    const user = firebase.auth().currentUser;
    const freeAdsRef = firebase.database().ref(`users/${user.uid}/freeAdsAvailable`);
    
    // Get the number of free ads available...
    freeAdsRef.once('value').then((freeAdsSnapshot) => {
      let freeAdsAvailable = freeAdsSnapshot.val();
      let adsToPayFor = selectedAds.length;
      let freeAdsUsed = 0;
        
        // If there are free ads available, use them first
        if (freeAdsAvailable > 0) {
            const freeAdsToUse = Math.min(freeAdsAvailable, adsToPayFor);
            freeAdsAvailable -= freeAdsToUse;
            adsToPayFor -= freeAdsToUse;
            freeAdsUsed = freeAdsToUse;
            freeAdsRef.set(freeAdsAvailable);

            // Set the first x ads to 'paid' using the free ads
            const adsToMarkAsPaid = selectedAds.splice(0, freeAdsToUse);
            adsToMarkAsPaid.forEach((adId) => {
                const adPaymentStatusRef = firebase.database().ref(`currentCarListings/${adId}/paymentStatus`);
                adPaymentStatusRef.set('paid');
            });
            // console.log(`Marked ${adsToMarkAsPaid.length} ads as paid using free ads.`);
        }
    
        // If there are still ads to pay for after using free ads
        if (adsToPayFor > 0) {
            const amountToCharge = adsToPayFor * 10 * 100;
            const processPayment = firebase.functions().httpsCallable('processStripePaymentForAd');
            processPayment({ amount: amountToCharge, selectedAds: selectedAds }).then((result) => {
                if (result.data.success) {
                  console.log('Payment successful, updating ad statuses to "paid".');
                  const successMessage = `Payment successful! ${selectedAds.length - adsToPayFor} ads were marked as paid using free ads. ` +
                                            `${adsToPayFor} ads were paid for.`;
                  displayMessage(successMessage);
                  const updatePromises = selectedAds.map((adId) => {
                      const adPaymentStatusRef = firebase.database().ref(`currentCarListings/${adId}/paymentStatus`);
                      return adPaymentStatusRef.set('paid'); // This returns a promise
                  });
              
                  // Wait for all update operations to complete
                  Promise.all(updatePromises).then(() => {
                      console.log("Now cleaning up...");
                      selectedAds = [];
                      adsToPayFor = null;
                      setTimeout(function() {
                        loadUserAds('current');
                        hideSpinner();
                      },2000);
                  }).catch(err => console.error('Couldnt clean up:', err));
              } else {
                  console.error('Payment failed:', result.data.error);
                  displayMessage('Payment failed: ' + result.data.error, false);
                  hideSpinner();
              }
            }).catch((error) => {
                console.error('Error processing payment:', error);
                displayMessage('Error processing payment: ' + error, false);
                hideSpinner();
            });
        } else {
            console.log(`No ads to be paid for...`);
            hideSpinner();
            // No payment needed, update ad statuses to "paid"
            // Implement this logic here
        }
    }).catch((error) => {
        console.error(`Error fetching free ads available:`, error);
        displayMessage('Error fetching free ads available: ' + error, false);
        hideSpinner();
    }).finally(() => {
        // hideSpinner();
    });
}


function displayMessage(message, isSuccess = true) {
  const messageBox = document.getElementById('freeAdsMessageBox');
  messageBox.style.display = 'block'; // Make sure the message box is visible
  messageBox.className = 'alert ' + (isSuccess ? 'alert-success' : 'alert-danger'); // Use alert-success for success messages, alert-danger for errors
  messageBox.textContent = message; // Set the message text
}



function unarchiveAd(adId) {
  // console.log(`Initiating unarchive process for ad with ID: ${adId}`);
  const archiveRef = firebase.database().ref(`archivedCarListings/${adId}`);

  archiveRef.once('value').then((snapshot) => {
      const adData = snapshot.val();
      // console.log(`Fetched ad data for unarchiving:`, adData);

      if (adData) {
          const currentRef = firebase.database().ref(`currentCarListings/${adId}`);
          // console.log(`Preparing to move ad to 'currentCarListings'`);

          currentRef.set(adData).then(() => {
              // console.log(`Ad data successfully written to 'currentCarListings'. Now removing from 'archivedCarListings'.`);
              archiveRef.remove().then(() => {
                  // console.log(`Ad with ID: ${adId} has been successfully unarchived and removed from 'archivedCarListings'.`);
                  showSpinner();
                  setTimeout(function() {
                      hideSpinner();
                      loadUserAds('archived');
                  }, 2000);
                  // Here you can also trigger any updates in the UI or further processing as needed.
              }).catch((removeError) => {
                  console.error(`Error removing ad from 'archivedCarListings':`, removeError);
              });
          }).catch((currentError) => {
              console.error('Error writing ad data to currentCarListings:', currentError);
          });
      } else {
          // console.log(`No ad data found for ID: ${adId}. Nothing to unarchive.`);
      }
  }).catch((error) => {
      console.error(`Error fetching ad with ID: ${adId} from 'archivedCarListings':`, error);
  });
}


// Placeholder for handlePaymentForAd function
function handlePaymentForAd(adId) {
  // console.log(`Handling payment for ad with ID: ${adId}`);
  // Implement payment logic here
}


function archiveAd(adId) {
  // console.log(`Initiating archive process for ad with ID: ${adId}`);
  const adRef = firebase.database().ref(`currentCarListings/${adId}`);

  adRef.once('value').then((snapshot) => {
    const adData = snapshot.val();
    // console.log(`Fetched ad data for archiving:`, adData);

    if (adData) {
      const archiveRef = firebase.database().ref(`archivedCarListings/${adId}`);
      // console.log(`Preparing to move ad to 'archivedCarListings'`);

      archiveRef.set(adData).then(() => {
        // console.log(`Ad data successfully written to 'archivedCarListings'. Now removing from 'currentCarListings'.`);
        adRef.remove().then(() => {
          // console.log(`Ad with ID: ${adId} has been successfully archived and removed from 'currentCarListings'.`);
          showSpinner();
          setTimeout(function() {
              hideSpinner();
              loadUserAds('current');
          }, 1500);
        }).catch((removeError) => {
          console.error(`Error removing ad from 'currentCarListings':`, removeError);
        });
      }).catch((archiveError) => {
        console.error('Error writing ad data to archivedCarListings:', archiveError);
      });
    } else {
      console.log(`No ad data found for ID: ${adId}. Nothing to archive.`);
    }
  }).catch((error) => {
    console.error(`Error fetching ad with ID: ${adId} from 'currentCarListings':`, error);
  });
}




function enableNotifications() {
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {

      if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then(function(registration) {
              console.log('Registration successful, scope is:', registration.scope);
              messaging.getToken({vapidKey: 'BJ-lxnA85P3WwnUzRDSxeOK7KZQuozOZ0kimTSzbKDw0p7btIw_EtjFqpYruoKaYft90gpHd2ecC7BgPvZth5L8'}).then((currentToken) => {
                if (currentToken) {
                  console.log('Token retrieved', currentToken);
                  // Proceed with sending the token to your server
                } else {
                  console.log('No registration token available. Request permission to generate one.');
                }
              }).catch((err) => {
                console.log('An error occurred while retrieving token. ', err);
              });
            }).catch(function(err) {
              console.log('Service worker registration failed, error:', err);
            });
        }

      messaging.getToken().then((currentToken) => {
        if (currentToken) {
          console.log('Token retrieved', currentToken);
          const deviceUUID = ensureUUID();
          // Send the token to your server with the user's Firebase ID token
          firebase.auth().currentUser.getIdToken(true).then(idToken => {
              const triggerUrl = 'https://us-central1-cartraderappirl.cloudfunctions.net/saveToken'; // Replace with your actual trigger URL
              fetch(triggerUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + idToken
                },
                body: JSON.stringify({ token: currentToken, uuid: deviceUUID })
              })
              .then(response => {
                if (!response.ok) {
                  throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
              })
              .then(data => {
                console.log('Token sent to server:', data);
                updateUIForEnabledNotifications(); // Call your function here after logging the success message
              })
              .catch(error => console.error('Error sending token to server:', error));
            });
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      }).catch(err => {
        console.log('An error occurred while retrieving token. ', err);
      });
    } else {
      console.log('Unable to get permission to notify.');
    }
  });
}



function unsubscribeFromNotifications() {
  firebase.auth().currentUser.getIdToken(true).then(idToken => {
    fetch('https://us-central1-cartraderappirl.cloudfunctions.net/unsubscribeNotifications', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + idToken,
        'Content-Type': 'application/json'
      },
      // No body is needed for this request
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to unsubscribe: ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log('Unsubscribe response:', data);
      // Update UI accordingly
      updateUIForDisabledNotifications();
      // document.getElementById('enableNotificationsMenuItem').innerText = 'Enable Notifications';
      // document.getElementById('enableNotificationsMenuItem').onclick = enableNotifications;
      // document.getElementById('enableNotificationsMenuItem').style.display = '';
      // document.getElementById('enableNotificationsMenuItem').style.color = "black";
    })
    .catch(error => {
      console.error('Error unsubscribing from notifications:', error);
    });
  }).catch(error => {
    console.error('Error getting ID token:', error);
  });
}


function isMessagingSupported() {
  return ('Notification' in window) && ('serviceWorker' in navigator) && firebase.messaging.isSupported();
}
