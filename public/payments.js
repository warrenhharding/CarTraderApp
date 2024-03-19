var stripe = Stripe('pk_test_51OpayUAWUi2tvbZgkdr7AtwmBLIBsBVOa2TMBkrKDm4V2idhaEPv324AG0Ydd2y1UPzpQS2JQC0INU9RqOGB4qaX00FiInlys0');
var elements = stripe.elements();
var card;

document.addEventListener("DOMContentLoaded", function() {
    // console.log("DOMContentLoaded event fired.");
    // Wait for the form to be fully loaded
    
    var cardElement = document.getElementById('card-element');
    if (cardElement) {
        // console.log("#card-element found.");
        card = elements.create('card');
        card.mount(cardElement);
        // console.log("Card element mounted successfully.");
    } else {
        // console.log("#card-element not found. Waiting for form to be fully loaded.");
    }
});


document.getElementById('payment-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    // Define audio elements for success and error sounds
    // const successSound = new Audio('path/to/success-sound.mp3');
    // const errorSound = new Audio('path/to/error-sound.mp3');

    const userEmail = firebase.auth().currentUser.email;
    const selectedPlan = document.getElementById('subscriptionPlan').value;

    if (!selectedPlan) {
        alert("Please select a subscription plan.");
        return;
    }

    // console.log("Form submitted. Selected plan:", selectedPlan);

    stripe.createPaymentMethod({
        type: 'card',
        card: card,
        billing_details: {email: userEmail},
    }).then((result) => {
        if (result.error) {
            var errorElement = document.getElementById('card-errors');
            errorElement.textContent = result.error.message;
        } else {
            var paymentMethodId = result.paymentMethod.id;
            // console.log("Payment Method created:", paymentMethodId);

            var createSubscription = firebase.functions().httpsCallable('createSubscription');
            createSubscription({ email: userEmail, paymentMethodId: paymentMethodId, planId: selectedPlan })
                .then((result) => {
                    if (result.data.success) {
                        var closeButton = document.querySelector('#paymentModal .btn-close');
                        closeButton.click();
                        alert('Subscription created successfully!');
                    } else {
                        alert('Failed to create subscription.');
                    }
                })
                .catch((error) => {
                    console.error("Error creating subscription:", error);
                    var errorElement = document.getElementById('card-errors');
                    errorElement.textContent = error.message;
                });
        }
    });
});


const createSubscription = firebase.functions().httpsCallable('createSubscription');

createSubscription({ email: email, token: token.id, planId: selectedPlan })
    .then((result) => {
        // Handle result
        alert('Subscription created successfully!');
        // Close modal and reset form as needed
    })
    .catch((error) => {
        // Handle errors
        console.error('Error creating subscription:', error);
        alert('Failed to create subscription. Please try again.');
    });



function makePayment() {
    var paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
    paymentModal.show();
}