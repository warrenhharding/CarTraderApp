async function prePopulateModal(uid) {
    if (!uid) {
        console.log("No UID provided for fetching userData.");
        return;
    }

    console.log(`Fetching user data for UID: ${uid}`);

    try {
        const userRef = firebase.database().ref(`users/${uid}`);
        const snapshot = await userRef.once('value');
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            console.log("Retrieved userData:", userData);

            Object.keys(userData).forEach(key => {
                const input = document.querySelector(`#userProfileModal [name="${key}"]`);
                if (input) {
                    console.log(`Found input for ${key}, setting value to:`, userData[key]);
                    input.value = userData[key];
                } else {
                    console.log(`No input found for ${key}.`);
                }
            });
        } else {
            console.log(`No user data found for UID: ${uid}`);
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
    }
}


document.getElementById('phoneNumber').addEventListener('input', function(e) {
    // Replace leading '00' with '+'
    if (e.target.value.startsWith('00')) {
        e.target.value = '+' + e.target.value.substring(2);
    }

    const phoneNumberPattern = /^(08[3-9]\d{7}|\+3538[3-9]\d{7}|\+(?!353)\d{11,})$/;

    if (phoneNumberPattern.test(e.target.value)) {
        e.target.setCustomValidity('');
    } else {
        e.target.setCustomValidity('Invalid phone number format.');
    }
    e.target.reportValidity(); // Immediately report the validity state
});


document.getElementById('eircode').addEventListener('input', function(e) {
    // Automatically convert to uppercase and insert a space after the third character if needed
    let value = e.target.value.toUpperCase().replace(/\s+/g, ''); // Remove existing spaces
    if (value.length > 3) {
        value = value.slice(0, 3) + ' ' + value.slice(3);
    }
    e.target.value = value;

    // Validate the format: 3 characters, a space, and then 4 characters
    if (/^[A-Z0-9]{3} [A-Z0-9]{4}$/.test(e.target.value)) {
        e.target.setCustomValidity('');
    } else {
        e.target.setCustomValidity('Eircode must be in the format: XXX XXXX');
    }
    e.target.reportValidity();
});





document.getElementById('userProfileForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the form from submitting traditionally

    // Validate the form here (if using custom validation logic)
    // For HTML5 validation, the form will automatically check for validity due to the `submit` event.

    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('No user signed in.');
        return;
    }

    // Collect user data from form
    const formData = {
        // Assuming emailAddress field is for display purposes only and not being updated
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        firstName: document.getElementById('firstName').value.trim(),
        surname: document.getElementById('surname').value.trim(),
        address1: document.getElementById('address1').value.trim(),
        address2: document.getElementById('address2').value.trim(),
        county: document.getElementById('county').value.trim(),
        eircode: document.getElementById('eircode').value.toUpperCase().trim(), // Ensure Eircode is uppercase
        country: document.getElementById('country').value.trim(),
        businessName: document.getElementById('businessName').value.trim(),
        name: (document.getElementById('firstName').value.trim() + " " + document.getElementById('surname').value.trim()).trim(),
    };

    // Handle avatar upload if a file was selected
    const fileInput = document.getElementById('avatarUpload');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const storageRef = firebase.storage().ref();
        const avatarRef = storageRef.child(`avatars/${user.uid}/${file.name}`);

        try {
            const snapshot = await avatarRef.put(file);
            const avatarURL = await snapshot.ref.getDownloadURL();
            formData.avatar = avatarURL; // Add avatar URL to formData
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return; // Exit if the avatar upload fails
        }
    }

    // Save user data to Firebase Realtime Database
    try {
        const userRef = firebase.database().ref(`users/${user.uid}`);
        await userRef.update(formData);
        console.log('User data saved successfully.');
        // Reset the form fields to null (or empty strings for input fields)
        document.getElementById('userProfileForm').reset(); 
        alert('Profile updated successfully!'); 
        var myModal = bootstrap.Modal.getInstance(document.getElementById('userProfileModal'));
        myModal.hide();
    } catch (error) {
        console.error('Error saving user data:', error);
        // Display an error message to the user
        alert('Failed to update profile. Please try again.');
    }
});



document.addEventListener('DOMContentLoaded', function () {
    // Attach event listener to 'Complete Profile Now' button
    document.getElementById('completeProfileNow').addEventListener('click', function() {
      const user = firebase.auth().currentUser;
  
      if (user) {
        const uid = user.uid;
  
        // Close the current modal
        var closeButton = document.querySelector('#completeProfileReminderModal .btn-close');
        closeButton.click();
  
        // Call prePopulateModal(uid) with the fetched uid
        prePopulateModal(uid);
  
        // Open the 'userProfileModal'
        var userProfileModal = new bootstrap.Modal(document.getElementById('userProfileModal'));
        userProfileModal.show();
      } else {
        console.error("No authenticated user found. Please log in.");
      }
    });

    document.getElementById('completeProfileLater').addEventListener('click', function() {
        // Show the toast notification
        var toastEl = document.getElementById('profileCompletionToast');
        var toast = new bootstrap.Toast(toastEl);
        toast.show();
    
        // Optionally, close the modal if you still want to close it upon clicking "Complete Profile Later"
        var modalEl = document.getElementById('completeProfileReminderModal');
        var modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();
    });
});
  