document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('addNewCarMake').addEventListener('click', function(event) {
        event.preventDefault();
        var addCarMakeModal = new bootstrap.Modal(document.getElementById('addCarMakeModal'));
        addCarMakeModal.show();
    });

    // Handle submission of the new car make form
    document.getElementById('addCarMakeForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const carMakeName = document.getElementById('carMakeName').value.trim();
        
        if (!carMakeName) {
        alert("Please enter a car make name.");
        return;
        }

        // Generate a new unique ID for the car make
        const newMakeId = firebase.database().ref().child('carMake').push().key;

        // Write the new car make to the database
        firebase.database().ref('carMake/' + newMakeId).set(carMakeName)
        .then(() => {
            // console.log('New car make added successfully.');
            carMakesArray.push(carMakeName); // Add to the local array
            document.getElementById('carMakeName').value = ''; // Clear the form
            $('#addCarMakeModal').modal('hide'); // Hide the modal using jQuery
        })
        .catch(error => {
            console.error('Error adding new car make:', error);
        });
    });
});

function fetchCarMakes() {
    firebase.database().ref('/carMake').once('value').then(snapshot => {
        const carMakes = snapshot.val();
        if (carMakes) {
            carMakesArray = Object.values(carMakes); // Convert object to array
            carMakesArray.sort(); // Sort the array in alphabetical order
            // console.log('Car makes loaded:', carMakesArray);
            populateCarMakesDropdown(carMakesArray); // Populate the dropdown
        } else {
            // console.log('No car makes found.');
            carMakesArray = [];
        }
    }).catch(error => {
        console.error('Error fetching car makes:', error);
    });
}


function populateCarMakesDropdown(carMakesArray) {
    const carMakeSelect = document.getElementById('carMake');
    carMakeSelect.innerHTML = ''; // Clear existing options
    
    // Add a "Please select" option
    const pleaseSelectOption = document.createElement('option');
    pleaseSelectOption.textContent = "Please select";
    pleaseSelectOption.disabled = true;
    pleaseSelectOption.selected = true;
    carMakeSelect.appendChild(pleaseSelectOption);

    // Array of top 10 car makes sold in Ireland
    const topCarMakes = ["Hyundai", "Toyota", "Kia", "Volkswagen", "Nissan", "Skoda", "Ford", "Peugeot", "Audi", "BMW"];
    
    // First, add the top car makes
    topCarMakes.forEach(make => {
        const option = document.createElement('option');
        option.value = make;
        option.textContent = make;
        carMakeSelect.appendChild(option);
    });
    
    // Add a separator
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = "──────────";
    carMakeSelect.appendChild(separator);
    
    // Then, add the rest, excluding the top makes already added
    carMakesArray
        .filter(make => !topCarMakes.includes(make)) // Exclude top makes
        .sort() // Sort the remaining alphabetically
        .forEach(make => {
            const option = document.createElement('option');
            option.value = make;
            option.textContent = make;
            carMakeSelect.appendChild(option);
    });
}


