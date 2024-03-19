document.addEventListener('DOMContentLoaded', async (event) => {
    const user = await getUserSignInStatus(); // Wait for user sign-in status
    
    if (user) {
        // The user is signed in, proceed with fetching favorites and listings
        await fetchUserFavourites();
        await fetchCarListings();

        var carListingsModalElement = document.getElementById('carListingsModal');
        var carListingsModal = new bootstrap.Modal(carListingsModalElement);
        carListingsModal.show();
    } else {
        // User is not signed in, handle accordingly
        console.log("User is not signed in.");
        // Optionally, handle scenarios where the user is not signed in,
        // such as displaying a sign-in prompt or redirecting to a login page.
    }
});



function fetchCarListings() {
    if (allListings.length > 0) {
        displayListings(allListings); // Display the existing listings
        return Promise.resolve(); // Return a resolved promise immediately
    }

    return new Promise((resolve, reject) => {
        const listingsRef = firebase.database().ref('currentCarListings').orderByKey();
        listingsRef.once('value', (snapshot) => {
            const listings = [];
            snapshot.forEach((childSnapshot) => {
                const listingId = childSnapshot.key;
                const listing = { ...childSnapshot.val(), listingId };
                allListings.push(listing);
                console.log("listings as we retrieve the data: ", allListings);
            });
        
            // Update the filter options based on the initial complete set of listings
            updateFilterOptions(allListings);
            // On the initial load, do not apply any filters
            const shouldClearFilters = true;
                
            // Now proceed to display the listings with or without filters
            const filteredListings = applyFilters(allListings, shouldClearFilters);
            displayListings(filteredListings); // A function to handle the display
            resolve();
            
        });
    });
}

function applyAndDisplayFilters() {
    // Apply filters to the allListings array
    const filteredListings = applyFilters(allListings); // Apply filters based on user's selections
    displayListings(filteredListings); // Display the filtered listings
}



function displayListings(listings) {
    console.log("listings: ", listings);
    const listingsContainer = document.querySelector('#listingsContainer');
    listingsContainer.innerHTML = ''; // Clear existing listings before displaying the new filtered set

    listings.forEach(listing => {
        const listingCard = createListingCard(listing); // Create a card for each listing
        listingsContainer.appendChild(listingCard); // Append the card to the container
    });
}


function applyFilters(listings, clearFilters = false) {
    console.log("Clear filters:", clearFilters);

    if (clearFilters) {
        console.log("Returning all listings without filtering.");
        return listings;
    }

    console.log("listings at the start are: ", listings);

    // Retrieve filter values
    const selectedLocations = Array.from(document.querySelectorAll('#locationFilter .dropdown-item-checkbox:checked')).map(input => input.value);
    const selectedMakes = Array.from(document.querySelectorAll('#makeFilter .dropdown-item-checkbox:checked')).map(input => input.value);
    
    console.log(document.getElementById('priceSlider')); // Should show the element
    console.log(document.getElementById('priceSlider').noUiSlider); // Should show the noUiSlider object

    // Now, let's log the values from the slider
    const sliderValues = document.getElementById('priceSlider').noUiSlider.get();
    console.log("Slider Values:", sliderValues);

    const maxPriceStr = document.getElementById('priceSlider').noUiSlider.get()[1].replace('€', '');
    const minPriceStr = document.getElementById('priceSlider').noUiSlider.get()[0].replace('€', '');
    const maxPrice = parseFloat(maxPriceStr);
    const minPrice = parseFloat(minPriceStr);

    const minYear = parseInt(document.getElementById('yearSlider').noUiSlider.get()[0]);
    const maxYear = parseInt(document.getElementById('yearSlider').noUiSlider.get()[1]);

    console.log("Selected Locations:", selectedLocations);
    console.log("Selected Makes:", selectedMakes);
    console.log("Max Price:", maxPrice);
    console.log("Min Price:", minPrice);
    console.log("Min Year:", minYear);
    console.log("Max Year:", maxYear);

    // Filter listings based on selected values
    const filteredListings = listings.filter(listing => {
        console.log("Kicking off the filteredListings check");
        // Convert listing price and year to appropriate types for comparison
        const listingPrice = parseFloat(listing.price);
        const listingYear = parseInt(listing.year);
    
        // Check if listing meets selected location and make criteria
        const locationMatch = !selectedLocations.length || selectedLocations.includes(listing.county);
        const makeMatch = !selectedMakes.length || selectedMakes.includes(listing.make);
    
        // Check if listing price is within the selected price range
        const priceMatch = listingPrice >= minPrice && listingPrice <= maxPrice;
    
        // Check if listing year is within the selected year range
        const yearMatch = listingYear >= minYear && listingYear <= maxYear;
    
        // Log detailed information about the listing and whether it matches each filter
        console.log(`Evaluating Listing - Make: ${listing.make}, Year: ${listingYear}, Price: ${listingPrice}, County: ${listing.county}`);
        console.log(`Location Match: ${locationMatch}, Make Match: ${makeMatch}, Price Match: ${priceMatch}, Year Match: ${yearMatch}`);
        console.log(`Filter Criteria - Locations: [${selectedLocations}], Makes: [${selectedMakes}], Price Range: €${minPrice} to €${maxPrice}, Year Range: ${minYear} to ${maxYear}`);
    
        // Log the reason why a listing is excluded
        if (!locationMatch) console.log(`Excluded due to location: ${listing.county}`);
        if (!makeMatch) console.log(`Excluded due to make: ${listing.make}`);
        if (!priceMatch) console.log(`Excluded due to price: ${listingPrice}`);
        if (!yearMatch) console.log(`Excluded due to year: ${listingYear}`);
    
        // Return true if listing meets all criteria, false otherwise
        return locationMatch && makeMatch && priceMatch && yearMatch;
    });
    console.log("Filtered listings count:", filteredListings.length);
    return filteredListings;
}




function createListingCard(listing) {
    console.log("About to create card for ", listing);
    const isFavourite = favouriteListings.includes(listing.listingId);
    const heartStyle = isFavourite ? 'color: #BC183F;' : 'color: white;';
    const heartIcon = `<i class="fas fa-heart favorite-heart" style="${heartStyle}" onclick="toggleFavorite('${listing.listingId}')" data-listing-id="${listing.listingId}"></i>`;


    const cardDiv = document.createElement('div');
    cardDiv.className = 'card mb-3';
    
    // Check for image availability and construct the image element if available
    const hasImage = Array.isArray(listing.images) && listing.images.length > 0;
    const imageUrl = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images[0] : 'https://via.placeholder.com/150x100?text=No+Image+Available';
    
    let cardContent = `
            <div class="row g-0">
            <div class="col-md-4">
                <img src="${imageUrl}" class="card-img-top" alt="Car Image">
                ${heartIcon} <!-- Use heartIcon here, ensuring it's the only heart icon included -->
            </div>
            <div class="col-md-8">
                <div class="card-body">`;

                if (listing.make || listing.year) {
                    cardContent += `<h5 class="card-title">${listing.make || ''} ${listing.year || ''}</h5>`;
                }
            
                if (listing.price) {
                    cardContent += `<p class="card-text">Price: €${listing.price}</p>`;
                }
            
                if (listing.county) {
                    cardContent += `<p class="card-text"><small class="text-muted">Location: ${listing.county}</small></p>`;
                }
            
                cardContent += `<a href="#" class="btn btn-primary" onclick="viewDetails('${listing.listingId}', event)">See Details</a>
                            </div>
                        </div>
                    </div>`;
            
                cardDiv.innerHTML = cardContent;
                // console.log(`Successfully created card for listing: ${listing.make} ${listing.year}`);
            
                return cardDiv;
            }


function fetchUserFavourites(attempt = 1) {
    return new Promise((resolve, reject) => {
        const attemptFetch = () => {
            const uid = firebase.auth().currentUser?.uid;
            console.log("Attempt:", attempt, "uid in fetchFavourites...:", uid);

            if (uid) {
                const userFavouritesRef = firebase.database().ref(`users/${uid}/favourites`);
                userFavouritesRef.once('value', snapshot => {
                    const favourites = snapshot.val();
                    favouriteListings = favourites ? Object.keys(favourites) : [];
                    console.log("favouriteListings =", favouriteListings);
                    resolve(); // Resolve the promise once favorites are fetched
                });
            } else if (attempt < 3) {
                setTimeout(() => {
                    attempt += 1;
                    attemptFetch(); // Retry fetching
                }, 200);
            } else {
                console.log("No user found after 3 attempts.");
                reject("No user found after 3 attempts."); // Reject the promise after all attempts
            }
        };

        attemptFetch(); // Initial attempt
    });
}



function viewDetails(listingId, event) {
    event.preventDefault(); // Prevent link default behavior
    if (!subscriptionActive) {
        alert('Please subscribe to view car details.');
    } else {
        // Logic to display the details of the listing
        // console.log('Showing details for listing ID:', listingId);
        // You might want to change this to actually navigate to the details view
    }
}

function toggleFavorite(listingId, sellerId) {
    const uid = firebase.auth().currentUser?.uid;
    if (uid) {
        const userFavouritesRef = firebase.database().ref(`users/${uid}/favourites`);
        const isFavourite = favouriteListings.includes(listingId);

        // Define a function to update the heart icon's style
        const updateHeartIconStyle = () => {
            const heartIcon = document.querySelector(`.favorite-heart[data-listing-id="${listingId}"]`);
            if (heartIcon) {
                heartIcon.style.color = isFavourite ? 'white' : '#BC183F'; // Toggle color based on new favorite status
            }
        };

        if (isFavourite) {
            // Remove from local favorites
            favouriteListings = favouriteListings.filter(id => id !== listingId);
            // Remove from Firebase
            userFavouritesRef.child(listingId).remove().then(updateHeartIconStyle); // Update icon after removal
        } else {
            // Add to local favorites
            favouriteListings.push(listingId);
            // Add to Firebase
            const update = {};
            update[listingId] = true;
            userFavouritesRef.update(update).then(updateHeartIconStyle); // Update icon after addition
        }
    } else {
        console.error("No user logged in...");
    }
}




function updateFilterOptions(listings) {
    console.log("listings in updateFilterOptions = ", listings);

    // Extract unique locations and makes, as well as the max price and year range from listings
    const locationSet = new Set(listings.map(listing => listing.county));
    const makeSet = new Set(listings.map(listing => listing.make));
    const maxPrice = Math.max(...listings.map(listing => listing.price));
    console.log("maxPrice being set is ", maxPrice);
    const minYear = Math.min(...listings.map(listing => listing.year));
    const maxYear = Math.max(...listings.map(listing => listing.year));

    // Initialize noUiSlider for price
    var priceSlider = document.getElementById('priceSlider');
    noUiSlider.create(priceSlider, {
        start: [1000, maxPrice], // Starting range
        connect: true, // Display a colored bar between the handles
        range: {
            'min': 1000,
            'max': maxPrice
        },
        step: 500,
        tooltips: true, // Show tooltips over the handles
        format: {
            // Define formatting for tooltip display
            to: function(value) {
                return `€${Math.round(value)}`;
            },
            from: function(value) {
                return Number(value.replace('€', ''));
            }
        }
    });

    // Initialize noUiSlider for year
    var yearSlider = document.getElementById('yearSlider');
    noUiSlider.create(yearSlider, {
        start: [minYear, maxYear], // Starting range
        connect: true,
        range: {
            'min': minYear,
            'max': maxYear
        },
        step: 1,
        tooltips: true,
        format: {
            to: function(value) {
                return Math.round(value);
            },
            from: function(value) {
                return Number(value);
            }
        }
    });

    // Populate dropdowns with locations and makes
    populateDropdown('#locationFilter', locationSet);
    populateDropdown('#makeFilter', makeSet);

    // Setup noUiSlider event listener for price
    priceSlider.noUiSlider.on('update', function(values, handle) {
        document.getElementById('minPriceValue').textContent = values[0];
        document.getElementById('maxPriceValue').textContent = values[1];
    });

    priceSlider.noUiSlider.on('change', function() {
        applyAndDisplayFilters(); // This will apply the filters when the user stops dragging the slider handle
    });

    // Setup noUiSlider event listener for year
    yearSlider.noUiSlider.on('update', function(values, handle) {
        document.getElementById('minYearValue').textContent = values[0];
        document.getElementById('maxYearValue').textContent = values[1];
    });

    yearSlider.noUiSlider.on('change', function() {
        applyAndDisplayFilters(); // This will apply the filters when the user stops dragging the slider handle
    });
}



function populateDropdown(selector, options) {
    console.log(`Populating dropdown '${selector}' with options:`, options);
    const container = document.querySelector(selector);
    if (!container) {
        console.error(`Dropdown container not found for selector: ${selector}`);
        return;
    }
    container.innerHTML = ''; // Clear existing options
    options.forEach(option => {
        const li = document.createElement('li');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = option.replace(/\s+/g, ''); // Remove spaces for a valid id
        input.value = option;
        input.className = 'dropdown-item-checkbox';
        const label = document.createElement('label');
        label.htmlFor = option.replace(/\s+/g, '');
        label.textContent = option;
        label.className = 'dropdown-item';
        li.appendChild(input);
        li.appendChild(label);
        container.appendChild(li);
    });

    // After populating the dropdown, reinitialize all Bootstrap dropdowns
    [].slice.call(document.querySelectorAll('.dropdown-toggle')).map(function (dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
    });
}


document.getElementById('locationFilter').addEventListener('change', function(event) {
    if (event.target.matches('.dropdown-item-checkbox')) {
        applyAndDisplayFilters(); // Call the function to apply filters and update display
    }
});

document.getElementById('makeFilter').addEventListener('change', function(event) {
    if (event.target.matches('.dropdown-item-checkbox')) {
        applyAndDisplayFilters(); // Call the function to apply filters and update display
    }
});


