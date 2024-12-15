export const elements = {
    loadingSpinner: document.getElementById('loading-spinner'),
    mainContainer: document.getElementById('main-content'),
    pageDescription: document.getElementById('page-description'),
    getLocationBtn: document.getElementById("get-location-btn"),
    editLocationBtn: document.getElementById("edit-location-btn"),
    shareLinkBtn: document.getElementById("share-link-btn"),
    placesList: document.getElementById("places-list"),
};

export function updatePageDescription(text) {
    console.log(`Updating text with: ${text}`);
    if (elements.pageDescription) {
        elements.pageDescription.textContent = text;
    } else {
        console.error('Page description element not found!');
    }
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
