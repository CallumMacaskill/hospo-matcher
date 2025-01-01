export const elements = {
    loadingSpinner: document.getElementById('loading-spinner'),
    mainContainer: document.getElementById('main-container'),
    inputsContainer: document.getElementById('inputs-container'),
    pageDescription: document.getElementById('page-description'),
    getLocationBtn: document.getElementById("get-location-btn"),
    editLocationBtn: document.getElementById("edit-location-btn"),
    shareLinkBtn: document.getElementById("share-link-btn"),
    resultsContainer: document.getElementById("results-container"),
    midpointText: document.getElementById("midpoint-text"),
    placesList: document.getElementById("places-list"),
};

export function refreshPageSubheading(session, sessionCode, userId) {
    // Generate contextualised page description
    var page_description = 'Start a new meetup by adding your location'
    if (session && sessionCode) {
        const code_substring = sessionCode.substring(0, 6);

        // Check if user has already submitted location
        const user_ids = Object.keys(session['user_coordinates'])
        if (user_ids.includes(userId)) {
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
        elements.shareLinkBtn.textContent = 'Share Link';
        elements.shareLinkBtn.classList.remove('inverted');
        elements.shareLinkBtn.disabled = false;
    }, 2000);
}

export function setVisibility(element, show) {
    if (show) {
        element.classList.add('show');
    } else {
        element.classList.remove('show');
    }
}

export async function setLoadingVisibility(show) {
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

    // Add it below the "Get Current Location" button
    const inputsContainer = document.getElementById("inputs-container");
    const getLocationButton = document.getElementById("get-location-btn");

    // Insert the autocomplete element after the "Get Current Location" button
    inputsContainer.insertBefore(placeAutocomplete, getLocationButton.nextSibling);
    placeAutocomplete.classList.add("autocomplete-widget"); // Add a custom class

    return placeAutocomplete; // Return for further manipulation if needed
}
