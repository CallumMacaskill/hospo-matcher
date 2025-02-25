import { deleteSessionLocation } from './api.js';

export const elements = {
    loadingSpinner: document.getElementById('loading-spinner'),
    mainContainer: document.getElementById('main-container'),
    inputsSection: document.getElementById('inputs-section'),
    inputsWrapper: document.getElementById('inputs-wrapper'),
    pageDescription: document.getElementById('page-description'),
    getLocationBtn: document.getElementById("get-location-btn"),
    shareLinkBtn: document.getElementById("share-link-btn"),
    resultsSection: document.getElementById("results-section"),
    midpointText: document.getElementById("midpoint-text"),
    shareMidpointBtn: document.getElementById('share-midpoint-btn'),
    placesText: document.getElementById('places-text'),
    placesList: document.getElementById("places-list"),
};

export function refreshPageSubheading(session, sessionCode, userId) {
    // Generate contextualised page description
    var page_description = 'Start a new meetup by adding your location'
    if (session && sessionCode) {
        const code_substring = sessionCode.substring(0, 6);

        // Check if user has already submitted location
        const userLocations = session['user_coordinates'][userId];
        if (userLocations && userLocations.length > 0) {
            page_description = `You've joined meetup #${code_substring}`;
        } else {
            page_description = `You're joining meetup #${code_substring}`;
        }
    }
    elements.pageDescription.textContent = page_description;
}


export function generatePlacesElements(data) {
    elements.placesList.innerHTML = ''; // Clear the current list
    data.places.forEach(place => {
        const placeDiv = document.createElement('div');
        placeDiv.classList.add('place');

        const title = document.createElement('h3');
        title.textContent = place.displayName.text;
        placeDiv.appendChild(title);

        const address = document.createElement('p');
        address.textContent = place.formattedAddress;
        placeDiv.appendChild(address);

        elements.placesList.appendChild(placeDiv);
    });
}


export function invertShareLinkStyling() {
    // Update button appearance and disable it
    elements.shareLinkBtn.textContent = 'Copied!';
    elements.shareLinkBtn.classList.add('inverted');
    elements.shareLinkBtn.disabled = true;

    // Revert button state after 2 seconds
    setTimeout(() => {
        elements.shareLinkBtn.textContent = 'Share Meetup';
        elements.shareLinkBtn.classList.remove('inverted');
        elements.shareLinkBtn.disabled = false;
    }, 1500);
}

export function invertShareAddressStyling() {
    // Midpoint address
    const address = elements.shareMidpointBtn.textContent;

    // Update button appearance and disable it
    elements.shareMidpointBtn.textContent = 'Copied!';
    elements.shareMidpointBtn.classList.add('inverted');
    elements.shareMidpointBtn.disabled = true;

    // Revert button state after 2 seconds
    setTimeout(() => {
        elements.shareMidpointBtn.textContent = address;
        elements.shareMidpointBtn.classList.remove('inverted');
        elements.shareMidpointBtn.disabled = false;
    }, 1500);
}

export function setVisibility(element, show) {
    if (show) {
        element.classList.add('show');
    } else {
        element.classList.remove('show');
    }
}

export async function setLoadingVisibility(show) {
    console.log(`Changing vis to ${show}`)
    if (show) {
        setVisibility(elements.mainContainer, false)
        await new Promise((resolve) => setTimeout(resolve, 100));
        setVisibility(elements.loadingSpinner, true)
    } else {
        setVisibility(elements.loadingSpinner, false)
        await new Promise((resolve) => setTimeout(resolve, 100));
        setVisibility(elements.mainContainer, true)
    }
}

export function initializeAutocomplete() {
    // Create the Place Autocomplete Element
    const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement();

    placeAutocomplete.addEventListener("focus", function (e) {
        setTimeout(() => {
            console.log('focused...');
            // Scroll to the top of the page
            window.scrollTo(0, 1);
        }, 50); // Delay to accommodate viewport resizing
    });

    // Insert the autocomplete element after the "Get Current Location" button
    elements.inputsWrapper.insertBefore(placeAutocomplete, elements.getLocationBtn.nextSibling);

    return placeAutocomplete; // Return for further manipulation if needed
}


export function populateAddressList(sessionCode, userId, locations, addresses) {
    // TODO: check that lists are the same length

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
            setLoadingVisibility(true)
            const locationIndex = event.target.dataset.index;

            await deleteSessionLocation(
                sessionCode,
                userId,
                String(locations[locationIndex]["latitude"]),
                String(locations[locationIndex]["longitude"])
            );
            setLoadingVisibility(true)
            location.reload();
        });
        
        // Append address text and delete button to the list item
        listItem.appendChild(addressText);
        listItem.appendChild(deleteButton);

        // Add list item to the address list container
        addressList.appendChild(listItem);
    }
}
