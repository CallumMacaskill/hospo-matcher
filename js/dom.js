export const elements = {
    loadingSpinner: document.getElementById('loading-spinner'),
    mainContainer: document.getElementById('main-content'),
    pageDescription: document.getElementById('page-description'),
    getLocationBtn: document.getElementById("get-location-btn"),
    editLocationBtn: document.getElementById("edit-location-btn"),
    shareLinkBtn: document.getElementById("share-link-btn"),
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


export function displayPlaces(data) {
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
