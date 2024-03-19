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
const stripe = require('stripe')('sk_test_51OpayUAWUi2tvbZgJMlKGdjl4XqY6hNJ4QA41WTmJryhIX7gCUOMVmn1VDUB0Yu3j6LguwR9X09bPIWO8e7omWGg00sRBjam62');


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



exports.checkUserProfileCompletion = functions.https.onRequest((req, res) => {
  // Enabling CORS for client-side requests
  cors(req, res, async () => {

    if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
    }

    // Extract the ID token from the Authorization header
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      console.error('No Firebase ID token was passed.');
      res.status(403).send('Unauthorized');
      return;
    }

    let idToken = req.headers.authorization.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      const userDataRef = admin.database().ref(`users/${uid}`);
      const snapshot = await userDataRef.once('value');
      if (!snapshot.exists()) {
          console.error(`User data for UID: ${uid} does not exist.`);
          res.status(404).send(`User data for UID: ${uid} does not exist.`);
          return;
      }

      const userData = snapshot.val();
      const requiredFields = ['emailAddress', 'phoneNumber', 'name', 'address1', 'address2', 'county', 'eircode', 'country', 'businessName', 'avatar'];
      const missingFields = requiredFields.filter(field => !userData || userData[field] === undefined || userData[field] === '');

      if (missingFields.length > 0) {
          console.log(`User ${uid} has incomplete profile:`, missingFields);
          res.status(200).send({complete: false, missingFields});
      } else {
          console.log(`User ${uid} has complete profile.`);
          res.status(200).send({complete: true});
      }
    } catch (error) {
      console.error('Error while verifying Firebase ID token:', error);
      res.status(error.code === 'auth/id-token-expired' ? 401 : 500).send('Unauthorized or internal server error');
    }

  })
});





exports.createSubscription = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  try {
      const { email, paymentMethodId, planId } = data;

      // Create a customer in Stripe with the user's email
      const customer = await stripe.customers.create({ email: email });

      // Attach the payment method to the customer and set it as the default payment method
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
      await stripe.customers.update(customer.id, {
          invoice_settings: { default_payment_method: paymentMethodId },
      });

      // Create subscription for the customer with the selected plan
      const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ plan: planId }],
      });

      // Save the customer ID and subscription ID to Firebase Database
      await admin.database().ref('users/' + context.auth.uid).update({
          stripeCustomerId: customer.id,
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
      });

      // Return success response
      return {
          success: true,
          subscriptionId: subscription.id,
          customerId: customer.id,
      };
  } catch (error) {
      console.error('Subscription creation failed:', error);
      throw new functions.https.HttpsError('internal', error.message);
  }
});



exports.saveToken = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method === 'OPTIONS') {
      // Send response to OPTIONS requests
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
    } else if (req.method === 'POST') {
      // Extract the ID token from the Authorization header
      if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        console.error('No Firebase ID token was passed.');
        res.status(403).send('Unauthorized');
        return;
      }

      const idToken = req.headers.authorization.split('Bearer ')[1];

      try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        
        const { token, uuid } = req.body;
        if (!token || !uuid) {
            console.error('Token or UUID is not provided in the request body.');
            res.status(400).send('Bad Request: No token or UUID in the request body');
            return;
        }

        // Save the token to the Firebase Realtime Database at the new specified path
        const tokenRef = admin.database().ref(`users/${uid}/tokens/${uuid}`);
        await tokenRef.set(token);

        console.log(`Token for device ${uuid} of user ${uid} received and saved:`, token);
        res.status(200).send({ success: true, message: 'Token saved successfully' });
    } catch (error) {
        console.error('Error while verifying Firebase ID token:', error);
        res.status(error.code === 'auth/id-token-expired' ? 401 : 500).send('Unauthorized or internal server error');
      }
    } else {
      res.status(405).send('Method Not Allowed');
    }
  });
});



exports.unsubscribeNotifications = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).send({success: false, message: 'Not allowed'});
    }

    // Check for Authorization header
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      return res.status(403).send({success: false, message: 'Unauthorized'});
    }

    const idToken = req.headers.authorization.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // Optionally delete the token from FCM here if needed.
      // For now, we'll just remove the token from the user's record in the database.
      await admin.database().ref(`users/${uid}`).update({token: null});

      return res.status(200).send({success: true, message: 'Unsubscribed successfully'});
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return res.status(500).send({success: false, message: 'Internal server error'});
    }
  });
});


async function createCustomer(email) {
  return await stripe.customers.create({
      email: email,
  });
}

async function addPaymentMethodToCustomer(paymentMethodId, customerId) {
  await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
  });
  // Set as default payment method
  await stripe.customers.update(customerId, {
      invoice_settings: {
          default_payment_method: paymentMethodId,
      },
  });
}

exports.createCustomer = createCustomer;
exports.addPaymentMethodToCustomer = addPaymentMethodToCustomer;



exports.createAdSummaryUnderUid = functions.database.ref('/currentCarListings/{adId}')
    .onCreate((snapshot, context) => {
        // Extract the ad data and adId
        const adData = snapshot.val();
        const adId = context.params.adId;

        // Assuming adData contains 'uid' of the user who posted the ad and summary details like 'title', 'price'
        const { seller, make, model, colour, price, timestamp, paymentStatus } = adData;

        // Define the path for the user's ad summary
        const userAdSummaryPath = `/users/${seller}/currentListings/${adId}`;

        // Prepare the summary data you want to store
        const summaryData = {
            make,
            model,
            colour,
            price,
            timestamp,
            paymentStatus,
            adId,
            // You can add more fields here as necessary
        };

        // Write the summary data to the user's listings
        return admin.database().ref(userAdSummaryPath).set(summaryData)
            .then(() => console.log(`Summary for ad ${adId} created successfully.`))
            .catch(error => console.error(`Error creating ad summary for ${adId}:`, error));
    });




    exports.archiveAd = functions.database.ref('/currentCarListings/{adId}')
    .onDelete((snapshot, context) => {
        const adData = snapshot.val();
        const adId = context.params.adId;
        const sellerId = adData.seller; // Assuming 'seller' contains the uid of the seller

        // Return the promise chain
        return admin.database().ref(`/users/${sellerId}/currentListings/${adId}`).once('value')
            .then(userAdSnapshot => {
                // Check if the user's ad record exists
                if (userAdSnapshot.exists()) {
                    const userAdData = userAdSnapshot.val();
                    // Use a multi-path update to ensure atomicity
                    let updates = {};
                    updates[`/archivedCarListings/${adId}`] = adData; // Archive the ad
                    updates[`/users/${sellerId}/currentListings/${adId}`] = null; // Remove from current listings
                    updates[`/users/${sellerId}/archivedListings/${adId}`] = userAdData; // Add to archived listings
                    return admin.database().ref().update(updates);
                } else {
                    return null; // No action needed if the user's ad record doesn't exist
                }
            })
            .catch(error => {
                console.error(`Error archiving ad ${adId}:`, error);
                throw error; // Rethrow the error so Cloud Functions knows it failed
            });
    });


exports.moveAdToArchived = functions.database.ref('/currentCarListings/{adId}')
    .onDelete((snapshot, context) => {
        // When an ad is deleted from 'currentCarListings', move it to 'archivedCarListings'
        const adData = snapshot.val();
        const adId = context.params.adId;
        const sellerUid = adData.seller; // Assuming 'seller' is the uid field

        // Define the paths
        const userCurrentAdPath = `/users/${sellerUid}/currentListings/${adId}`;
        const userArchivedAdPath = `/users/${sellerUid}/archivedListings/${adId}`;

        // Check if ad exists in user's current listings and move to archived listings
        const userAdsRef = admin.database().ref(userCurrentAdPath);
        return userAdsRef.once('value')
            .then((userAdSnapshot) => {
                if (userAdSnapshot.exists()) {
                    const userUpdates = {};
                    userUpdates[userCurrentAdPath] = null;
                    userUpdates[userArchivedAdPath] = adData;
                    return admin.database().ref().update(userUpdates);
                } else {
                    console.log(`Ad ${adId} does not exist in user's current listings.`);
                    return null;
                }
            }).catch((error) => {
                console.error(`Error moving ad ${adId} to archived listings:`, error);
            });
    });



    exports.unarchiveAd = functions.database.ref('/archivedCarListings/{adId}')
    .onDelete((snapshot, context) => {
        const adData = snapshot.val();
        const adId = context.params.adId;
        const sellerId = adData.seller; // Assuming 'seller' contains the uid of the seller

        if (!adData) {
            console.log(`Ad ${adId} data is already null, indicating it might have already been unarchived.`);
            return null;
        }

        // Prepare the database paths
        const userArchivedAdPath = `/users/${sellerId}/archivedListings/${adId}`;
        const userCurrentAdPath = `/users/${sellerId}/currentListings/${adId}`;

        // Begin a database transaction to move the ad
        const updates = {};
        updates[`/currentCarListings/${adId}`] = adData;
        updates[userArchivedAdPath] = null;
        updates[userCurrentAdPath] = adData;

        return admin.database().ref().update(updates).then(() => {
            console.log(`Ad ${adId} successfully moved from archived to current listings.`);
        }).catch(error => {
            console.error(`Error unarchiving ad ${adId}:`, error);
            throw error;
        });
    });





exports.processStripePaymentForAd = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    console.log('Starting payment process for user:', context.auth.uid);

    const amount = data.amount;
    const selectedAds = data.selectedAds;
    const uid = context.auth.uid;

    try {
        console.log(`Fetching Stripe customer ID for user ${uid}`);
        const customerRef = admin.database().ref(`users/${uid}/stripeCustomerId`);
        const customerSnapshot = await customerRef.once('value');
        const stripeCustomerId = customerSnapshot.val();

        if (!stripeCustomerId) {
            console.error('Stripe customer ID not found for user:', uid);
            throw new Error('Stripe customer ID not found.');
        }

        // Retrieve the customer details from Stripe
        console.log(`Retrieving customer details for customer ID: ${stripeCustomerId}`);
        const customerDetails = await stripe.customers.retrieve(stripeCustomerId);
        console.log(`Customer default payment method: ${customerDetails.invoice_settings.default_payment_method}`);

        if (!customerDetails.invoice_settings.default_payment_method) {
            throw new Error('No default payment method found for this customer.');
        }

        console.log(`Found Stripe customer ID ${stripeCustomerId} for user ${uid}. Creating Payment Intent.`);

        // Create a Payment Intent for the specified amount
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'eur',
          customer: stripeCustomerId,
          payment_method: customerDetails.invoice_settings.default_payment_method, // Explicitly use the default payment method
          description: `Charge for ${selectedAds.length} ads`,
          confirm: true,
          off_session: true,
          metadata: { selectedAds: JSON.stringify(selectedAds) },
      });

        console.log(`Payment Intent created successfully. ID: ${paymentIntent.id}`);

        // Retrieve all FCM tokens for the user
        const tokensSnapshot = await admin.database().ref(`users/${uid}/tokens`).once('value');
        const tokens = tokensSnapshot.val();

        if (tokens) {
            const messagePromises = Object.values(tokens).map(token => {
                const message = {
                    token,
                    notification: {
                        title: 'Payment Successful',
                        body: `Thank you for your payment of €${amount / 100}. Your ad is now live.`,
                    },
                };
                return admin.messaging().send(message);
            });

            // Send all messages via FCM
            Promise.all(messagePromises).then(responses => {
                console.log('Successfully sent all messages:', responses);
            }).catch(error => {
                console.error('Error sending FCM messages:', error);
            });
        } else {
            console.log(`No FCM tokens found for user: ${uid}`);
        }

        return { success: true, paymentIntentId: paymentIntent.id };
    } catch (error) {
        console.error('Stripe Payment Intent error for user:', uid, error);

        // Log detailed error information
        console.error(JSON.stringify(error, null, 2));

        if (error.type === 'StripeCardError') {
            throw new functions.https.HttpsError('aborted', `Stripe Payment Intent failed: ${error.message}`);
        } else {
            throw new functions.https.HttpsError('internal', 'An error occurred during payment processing.');
        }
    }
});





exports.syncPaymentStatus = functions.database.ref('/currentCarListings/{adId}/paymentStatus')
.onUpdate(async (change, context) => {
    const paymentStatus = change.after.val();
    const adId = context.params.adId;

    // We need to first retrieve the ad to get the seller's UID
    const adSnapshot = await change.after.ref.parent.once('value');
    const uid = adSnapshot.child('seller').val();

    if (!uid) {
        throw new Error(`Seller UID not found for adId: ${adId}`);
    }

    // Update the corresponding record in the user's current listings
    const userAdPaymentStatusRef = admin.database().ref(`users/${uid}/currentListings/${adId}/paymentStatus`);
    return userAdPaymentStatusRef.set(paymentStatus);
});