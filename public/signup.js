function onSignIn(credential_response) {
    console.log("onSignIn has been called...");
    var id_token = credential_response.credential;

    firebase.auth().signInWithCredential(firebase.auth.GoogleAuthProvider.credential(id_token))
    .then((result) => {
        // User signed in
        // You can get the user's information from result.user
        console.log("User signed in to Firebase:", result.user);
        handleGoogleUser(result.user);
    })
    .catch((error) => {
        // Handle errors here
        // console.error("Error during Firebase Sign-In: ", error);
    });
  }


// Function to calculate and set the Google Sign-In button width
function setGoogleSignInButtonWidth() {
    console.log("running setGoogleSignInButtonWidth");
    const emailAuthButton = document.getElementById("emailAuthButton");
    const containerWidth = emailAuthButton.clientWidth;
    console.log("containerWidth: ", containerWidth);

    // Create a configuration object with the calculated width
    const buttonConfig = {
        width: containerWidth,
    };

    // Render the Google Sign-In button with the updated configuration
    console.log("About to render the Google Sign-In button with the updated configuration");
    google.accounts.id.renderButton(document.getElementById("googleSignInButton"), buttonConfig);
}
  





function handleGoogleUser(user) {
    if (user) {
        console.log("Google user authenticated:", user.displayName, user.email);

        if (!user.emailVerified) {
            // Handle the scenario where the user is authenticated but email is not verified
            console.log("User is authenticated but email is not verified.");
            user.sendEmailVerification().then(() => {
                // Log for debugging
                // console.log('Verification email sent.');
    
                // Inform the user that a verification email has been sent
                alert("We've just sent a verification email to your email address. Please verify to continue with your purchase.");
    
                // Close the modal after showing the message
                $('#authModal').modal('hide');
            }).catch((error) => {
                // Log the error
                // console.error('Error sending verification email:', error);
    
                // Inform the user there was an issue
                alert("Oops. We seem to be having a problem with your login. Please try again and if the problem persists, please send an email to help@dateroulette.ie and we'll help you.");
    
                // It might also be a good idea to keep the modal open in case of an error so the user can try again or use other means to authenticate.
            });
            // Additional logic for unverified emails can go here
        } else {
            // Handle the scenario where the user is authenticated and email is verified
            // console.log("User is authenticated and email is verified.");
            updateUIForLoggedInUser(user); // Update your UI as needed
            // Redirect or proceed with additional logic for a verified user
            redirectToNextStep();
        }
    } else {
        // Handle the scenario where the user is not authenticated
        // console.log("User is not authenticated.");
        alert("Authentication failed or was cancelled. Please try again.");
        // Redirect to login page or show error message
    }

    // Close the modal (if still open)
    $('#authModal').modal('hide');
}


function updateUIForLoggedInUser(user) {
    // console.log("The user we just logged in was ", user)
}

function redirectToNextStep() {
    console.log("Redirecting to the next step...");
    setTimeout(async function() {
        // showModalProcessPayment();
    }, 0);
    
}





function handleEmailPasswordUser(user) {
    if (!user.emailVerified) {
        user.sendEmailVerification().then(() => {
            // Log for debugging
            // console.log('Verification email sent.');

            // Inform the user that a verification email has been sent
            alert("We've just sent a verification email to your email address. Please verify to continue with your purchase.");

            // Close the modal after showing the message
            $('#authModal').modal('hide');
        }).catch((error) => {
            // Log the error
            // console.error('Error sending verification email:', error);

            // Inform the user there was an issue
            alert("Oops. We seem to be having a problem with your login. Please try again and if the problem persists, please send an email to help@dateroulette.ie and we'll help you.");

            // It might also be a good idea to keep the modal open in case of an error so the user can try again or use other means to authenticate.
        });
    } else {
        // User's email is already verified
        // console.log("User is signed in and has been verified.");
        $('#authModal').modal('hide'); // Close the modal if no action is needed
        // alert("Please select your event again and click on Buy Now to continue the purchase.")
        redirectToNextStep();
    }
}
  

        

function showSpinner() {
    document.getElementById('spinner').style.display = 'block';
    // console.log("Should be spinning now...");
}

function hideSpinner() {
    document.getElementById('spinner').style.display = 'none';
    // console.log("Should have hidden spinning now...");
}


function resetPassword() {
    const auth = firebase.auth();
    const email = document.getElementById('userEmail').value;

    if (email) { // Check if the email field is not empty
        auth.sendPasswordResetEmail(email).then(function() {
            // Email sent, inform the user
            alert("Password reset email sent. Please check your inbox.");
        }).catch(function(error) {
            // Handle errors
            console.error("Error sending password reset email:", error);
            alert("Error sending password reset email. Please try again.");
        });
    } else {
        // Prompt user to enter their email
        alert("Please enter your email address to reset your password.");
    }
}
