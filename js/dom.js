import { generateCrudUrl } from './utils.js';

export class Dom {
    constructor() {
        this.elements = {
            pageHeadingBtn: document.getElementById('page-heading-btn'),
            loadingSpinner: document.getElementById('loading-spinner'),
            descriptionContainer: document.getElementById('description-container'),
            contextContainer: document.getElementById('context-container'),
            contextText: document.getElementById('context-text'),
            mainContainer: document.getElementById('main-content'),
            locationsContainer: document.getElementById('locations-container'),
            locationsList: document.getElementById('locations-list'),
            flowChoiceContainer: document.getElementById('flow-choice-container'),
            instruction: document.getElementById('instruction'),
            shareFlowBtn: document.getElementById('share-flow-btn'),
            manualFlowBtn: document.getElementById('manual-flow-btn'),
            locationInputsContainer: document.getElementById('location-inputs-container'),
            geolocationError: document.getElementById('geolocation-error'),
            getLocationBtn: document.getElementById("get-location-btn"),
            shareContainer: document.getElementById('share-container'),
            shareLinkBtn: document.getElementById("share-link-btn"),
            resultsSection: document.getElementById("results-section"),
            resultsContainer: document.getElementById('results-container'),
            midpointContext: document.getElementById("midpoint-context"),
            shareMidpointBtn: document.getElementById('share-midpoint-btn'),
            placesText: document.getElementById('places-text'),
            placesList: document.getElementById("places-list"),
        }
    }

    generatePlacesElements(places) {
        this.elements.placesList.innerHTML = ''; // Clear the current list
        if (!places) {
            console.log('No places to generate elements for');
            return;
        }
        console.log(`Creating page elements for ${places.length} places`)
        places.forEach(place => {
            const placeDiv = document.createElement('div');
            placeDiv.classList.add('place');

            const title = document.createElement('h3');
            title.textContent = place.displayName.text;
            placeDiv.appendChild(title);


            const address = document.createElement('p');
            address.textContent = place.formattedAddress;
            placeDiv.appendChild(address);

            this.elements.placesList.appendChild(placeDiv);
        });
    }

    invertButtonStyling(element, text) {
        console.log(`Toggling styling for element ${element.id}`)
        // Update button appearance and disable it
        element.textContent = 'Copied!';
        element.classList.add('inverted');
        element.disabled = true;

        // Revert button state after 2 seconds
        setTimeout(() => {
            element.textContent = text;
            element.classList.remove('inverted');
            element.disabled = false;
        }, 1500);
    }

    setVisibility(element, show) {
        if (show) {
            element.classList.add('show');
        } else {
            element.classList.remove('show');
        }
    }

    async setLoadingVisibility(show) {
        console.log(`Setting loading visibility to ${show}`)
        if (show) {
            this.setVisibility(this.elements.mainContainer, false)
            await new Promise((resolve) => setTimeout(resolve, 100));
            this.setVisibility(this.elements.loadingSpinner, true)
        } else {
            this.setVisibility(this.elements.loadingSpinner, false)
            await new Promise((resolve) => setTimeout(resolve, 100));
            this.setVisibility(this.elements.mainContainer, true)
        }
    }

    initializeAutocomplete(localiseCountry) {
        // Create the Place Autocomplete Element
        console.log('Initialising places autocomplete widget')
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
            componentRestrictions: localiseCountry ? { country: localiseCountry } : undefined
        });

        placeAutocomplete.id = 'place-autocomplete-input';
        
        placeAutocomplete.addEventListener("focus", function (e) {
            setTimeout(() => {
                // Scroll to the top of the page - workaround for buggy pac positioning on mobile
                window.scrollTo(0, 1);
            }, 50); // Delay to accommodate viewport resizing
        });

        // Insert the autocomplete element after the "Get Current Location" button
        console.log('Inserting widget')
        this.elements.getLocationBtn.parentNode.insertBefore(placeAutocomplete, this.elements.getLocationBtn);
        return placeAutocomplete;
    }

    showGeolocationPermissionsError(error) {
        let errorText = "Location information is unavailable. Try searching instead."
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorText = "Try again and approve permissions to use your location."
          case error.UNKNOWN_ERROR:
            errorText = "An unknown error occurred. Try searching for a location instead."
            break;
        }
        this.elements.geolocationError.innerHTML = errorText;
        this.elements.geolocationError.classList.remove('hidden');
      }

    populateLocationsList(meetupCode, userId, allLocations) {
        console.log(`Populating locations list for ${meetupCode} with ${userId}`)
        // Clear the existing list
        const locationsList = this.elements.locationsList;
        locationsList.innerHTML = "";

        // Populate the list dynamically
        for (let i = 0; i < allLocations.length; i++) {
            const location = allLocations[i];

            // Create list item
            const listItem = document.createElement("li");
            listItem.className = "address-item";

            // Address text
            const addressText = document.createElement("span");
            addressText.textContent = `📍 ${location.formattedAddress}`;
            listItem.appendChild(addressText);

            // Add delete button only if the location belongs to the current user
            if (location.userId === userId) {
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "X";
                deleteButton.dataset.locationId = location.id;

                deleteButton.addEventListener("click", async (event) => {
                    this.setLoadingVisibility(true);
                    const locationId = event.target.dataset.locationId;

                    const url = generateCrudUrl('/.netlify/functions/delete_meetup_location', {
                        code: meetupCode,
                        userId: userId,
                        locationId: locationId,
                    });

                    const response = await fetch(url);
                    await response.json();
                    window.location.reload();
                });

                listItem.appendChild(deleteButton);
            }

            // Add list item to the address list container
            locationsList.appendChild(listItem);
        }
    }

    updateMeetupResultElements(meetup) {
        console.log('Assigning meetup results to page elements')
        if (meetup.resultMessage) {
            this.elements.midpointContext.innerText = meetup.resultMessage;
        }

        if (meetup.resultAddress) {
            this.elements.shareMidpointBtn.innerHTML = meetup.resultAddress;
        }

        this.generatePlacesElements(meetup.nearbyPlaces);
    }
}
