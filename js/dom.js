import { generateCrudUrl } from './utils.js';

export class Dom {
    constructor() {
        this.elements = {
            loadingSpinner: document.getElementById('loading-spinner'),
            mainContainer: document.getElementById('main-content'),
            inputsSection: document.getElementById('inputs-section'),
            meetupContextHeader: document.getElementById('meetup-context-header'),
            meetupContextText: document.getElementById('meetup-context-text'),
            getLocationBtn: document.getElementById("get-location-btn"),
            locationsContainer: document.getElementById('locations-container'),
            shareContainer: document.getElementById('share-container'),
            shareLinkBtn: document.getElementById("share-link-btn"),
            resultsSection: document.getElementById("results-section"),
            midpointText: document.getElementById("midpoint-text"),
            shareMidpointBtn: document.getElementById('share-midpoint-btn'),
            placesText: document.getElementById('places-text'),
            placesList: document.getElementById("places-list"),
        }
    }

    generatePlacesElements(places) {
        console.log(`Creating page elements for ${places.length} places`)
        this.elements.placesList.innerHTML = ''; // Clear the current list
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

    initializeAutocomplete() {
        // Create the Place Autocomplete Element
        console.log('Initialising places autocomplete widget')
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();
    
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

    populateAddressList(meetupCode, userId, locations, addresses) {
        console.log(`Creating page elements for ${addresses.length} addresses`)
        // Clear the existing list
        const addressList = document.getElementById("address-list");
        addressList.innerHTML = "";
    
        // Populate the list dynamically
        for (let i = 0; i < locations.length; i++) {
            // Create list item
            const listItem = document.createElement("li");
            listItem.className = "address-item";
    
            // Address text
            const addressText = document.createElement("span");
            addressText.textContent = `📍 ${addresses[i]}`;
    
            // Delete button
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "X";
    
            // Attach the location index as a data attribute
            deleteButton.dataset.index = i;
    
            // Add event listeners
            deleteButton.addEventListener("click", async (event) => {
                this.setLoadingVisibility(true)
                const locationIndex = event.target.dataset.index;
    
                const url = generateCrudUrl('/.netlify/functions/delete_meetup_location', {
                    code: meetupCode,
                    userId: userId,
                    latitude: String(locations[locationIndex]["latitude"]),
                    longitude: String(locations[locationIndex]["longitude"]),
                });
                const response = await fetch(url)
                const data = await response.json()
                this.setLoadingVisibility(true)
                location.reload();
            });
            
            // Append address text and delete button to the list item
            listItem.appendChild(addressText);
            listItem.appendChild(deleteButton);
    
            // Add list item to the address list container
            addressList.appendChild(listItem);
        }
    }
    
    updateMeetupResultElements(meetup) {
        console.log('Assigning meetup results to page elements')
        if (meetup.resultMessage) {
            this.elements.midpointText.innerText = meetup.resultMessage;
        }
    
        if (meetup.resultAddress) {
            this.elements.shareMidpointBtn.innerHTML = meetup.resultAddress;
            this.elements.shareMidpointBtn.classList.add('show');
        }
    
        if (meetup.nearbyPlaces) {
            this.generatePlacesElements(meetup.nearbyPlaces);
            this.elements.placesText.classList.add('show')
        }
        this.elements.resultsSection.classList.add("show")
    }
}
