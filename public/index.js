var database = firebase.database();
const auth = firebase.auth();
const functions = firebase.functions();

// Check if a user is signed in
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // console.log("User signed in is ", user.email);
        // User is signed in
        updateUserUI(user);
        // Reference to the user's data in the Realtime Database
        var userRef = firebase.database().ref('users/' + user.uid);

        // Fetch the user's data from the Realtime Database
        userRef.once('value').then((snapshot) => {
            const userData = snapshot.val();

            if (userData) {
                // Check if the emailVerified field exists
                if ('emailVerified' in userData) {
                    // console.log('emailVerified field exists.');

                    // Check if the emailVerified field is false
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
            } else {
                // console.error('No user data found in the database.');
            }
        });
    } else {
        // User is not signed in
        // console.error('No user is currently signed in.');
    }
});

// Log out user on page load
// firebase.auth().signOut().then(() => {
//     // console.log("User signed out.");
//   }).catch((error) => {
//     console.error("Error signing out: ", error);
//   });


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
                        console.log("error: ", error);
                        if (error.code === 'auth/email-already-in-use') {
                            // Email already in use, try signing in
                            auth.signInWithEmailAndPassword(email, password)
                                .then((userCredential) => {
                                    handleEmailPasswordUser(userCredential.user);
                                })
                                .catch((error) => {
                                    console.error("Error during Email/Password Sign-In: ", error);
                                });
                        } else {
                            alert("We seem to be having a problem logging you in. Please try again and if the problem is nore resolved please send us an email at help@dateroulette.ie and we'll help get you logged in.");
                            console.error("Error during Email/Password Sign-Up: ", error);
                        }
                    });
            })
            .catch((error) => {
                console.error("Error setting persistence: ", error);
            });
    });
    


})