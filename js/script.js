import { elements, updatePageDescription, displayPlaces } from './dom.js';
import { getSession, createSession, updateSession } from './api.js';
import { getLocation } from './geolocation.js';
import { CurrentUserData, calculateMidpoint } from './session.js';
import { fetchData } from './utils.js';

// Load current user's browser data
var currentUserData = new CurrentUserData()
console.log(`Using session code: ${currentUserData.getSessionCode()}`)

// Get session data if available
if ( currentUserData.getSessionCode()) {
    console.log(`Reading session from database.`)
    var session = await getSession(currentUserData.getSessionCode())
    console.log(`Read session from database.`)
}

console.log(`Session: ${session}`)

// Generate contextualised page description
var page_description = 'Start a new meetup by adding your location'
if ( session ) {
    const code_substring = currentUserData.getSessionCode().substring(0, 6);

    // Check if user has already submitted location
    const user_ids = Object.keys(session['user_coordinates'])
    if (user_ids.includes(currentUserData.getOrCreateUserId())) {
        page_description = `You've already joined meetup #${code_substring}`;
        elements.editLocationBtn.classList.remove('hidden')
        elements.getLocationBtn.classList.add('hidden')
    } else {
        page_description = `You're joining meetup #${code_substring}`;
    }

}

// Update page description and show element
updatePageDescription(page_description);
elements.pageDescription.classList.remove('hidden');

// Show main content and hide loading spinner
elements.loadingSpinner.classList.add('hidden');
elements.mainContainer.classList.remove('hidden');

async function sessionLocationHandling() {
    console.log('Button clicked');
    const { latitude, longitude } = await getLocation();
    console.log(`Loaded coordinates: ${latitude}, ${longitude}`)
    if (!currentUserData.getSessionCode()) {
        console.log('Creating new session.')
        await createSession(currentUserData.getOrCreateUserId(), latitude, longitude);
        console.log('Created new session.')
        // Upon success, prompt user to share with friends
    } else {
        console.log(`Updating session with current user's location`)
        await updateSession(
            currentUserData.getSessionCode(),
            currentUserData.getOrCreateUserId(),
            latitude,
            longitude
        );

        console.log('Calculating midpoint of all session users.')
        const midpoint = calculateMidpoint(latitude, longitude, session);
        console.log(`Calculated midpoint: ${midpoint.latitude}, ${midpoint.longitude}`)

        //console.log(`Fetching Nearby Places results.`)
        //const placesData = await fetchData(`/.netlify/functions/google_maps_places_search?latitude=${midpoint.latitude}&longitude=${midpoint.longitude}`);
        //displayPlaces(placesData);
    }
    // Show share link button
    elements.shareLinkBtn.classList.remove('hidden');
}

function shareLink() {
    if (currentUserData.getSessionCode()) {
        const url = `http://localhost:8888/?code=${currentUserData.getSessionCode()}`;
        navigator.clipboard.writeText(url);
    }
}

// Add event listeners to HTML elements
elements.getLocationBtn.addEventListener("click", sessionLocationHandling);
elements.shareLinkBtn.addEventListener("click", shareLink);
elements.editLocationBtn.addEventListener('click', () => {
    elements.editLocationBtn.classList.add('hidden');
    elements.getLocationBtn.classList.remove('hidden');
  });
