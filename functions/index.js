/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */


const functions = require('firebase-functions')
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { TZDate, convertDateToTimezone } = require('timezone-support');


var serviceAccount = require("./cartraderappirl-firebase-adminsdk-zia0b-338dd26f99.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cartraderappirl-default-rtdb.europe-west1.firebasedatabase.app"
  });



  exports.createUserRecord = functions.auth.user().onCreate((user) => {
    const uid = user.uid;
    const displayName = user.displayName;
    const email = user.email;
    const photoURL = user.photoURL;
    const emailVerified = user.emailVerified;
    const metadata = user.metadata;
    const phoneNumber = user.phoneNumber;
    const signupDate = Math.floor(Date.now() / 1000);
    // ...

    const userData = {
        uid: uid,
        displayName: displayName,
        email: email,
        photoURL: photoURL,
        emailVerified: emailVerified,
        metadata: metadata,
        phoneNumber: phoneNumber,
        userType: "customer",
        signupDate: signupDate,
    };

    // Write user data to the database
    return admin.database().ref(`/users/${uid}`).set(userData);
});