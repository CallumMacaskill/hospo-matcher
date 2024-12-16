import { elements, refreshPageSubheading, displayPlaces } from './dom.js';
import { getSession, createSession, updateSession } from './api.js';
import { getLocation } from './geolocation.js';
import { CurrentUserData, calculateMidpoint } from './session.js';
import { fetchData } from './utils.js';

// Load current user's browser data
var currentUserData = new CurrentUserData()
console.log(`Using session code: ${currentUserData.getSessionCode()}`)

// Get session data if available
if (currentUserData.getSessionCode()) {
    console.log(`Reading session from database.`)
    var session = await getSession(currentUserData.getSessionCode())
    console.log(`Read session from database.`)
}

// Check if user has already submitted location
if (session) {
    const user_ids = Object.keys(session['user_coordinates'])
    if (user_ids.includes(currentUserData.getOrCreateUserId())) {
        // Offer changing location data
        elements.editLocationBtn.classList.remove('hidden')
        elements.getLocationBtn.classList.add('hidden');

        // Calculate midpoint, show results, show link button
        evaluateSession(session)
        elements.shareLinkBtn.classList.remove('hidden');
    }
}

// Generate a contextualised description based on data inputs
refreshPageSubheading(
    session,
    currentUserData.getSessionCode(),
    currentUserData.getOrCreateUserId()
);

// Show main content and hide loading spinner
elements.loadingSpinner.classList.add('hidden');
elements.mainContainer.classList.remove('hidden');

async function evaluateSession(session, latitude, longitude) {
    console.log('Calculating midpoint of all session users.')
    const midpoint = calculateMidpoint(session, latitude, longitude);
    console.log(`Calculated midpoint: ${midpoint.latitude}, ${midpoint.longitude}`)

    // Update midpoint element text
    elements.midpointText.innerText = `Your meetup midpoint is ${midpoint.latitude}, ${midpoint.longitude}`;
    elements.midpointText.classList.remove('hidden');

    console.log(`Fetching Nearby Places results.`)
    const placesData = await fetchData(`/.netlify/functions/google_maps_places_search?latitude=${midpoint.latitude}&longitude=${midpoint.longitude}`);
    displayPlaces(placesData);
}

async function processUserSessionInput() {
    const { latitude, longitude } = await getLocation();
    console.log(`Loaded coordinates: ${latitude}, ${longitude}`)
    if (!currentUserData.getSessionCode()) {
        console.log('Creating new session.')

        elements.loadingSpinner.classList.remove('hidden');
        elements.mainContainer.classList.add('hidden');

        const response = await createSession(currentUserData.getOrCreateUserId(), latitude, longitude);

        // Update current data with new session values
        session = response['session']
        currentUserData.setSessionCode(session['code'])

        // Update page context after creating session
        refreshPageSubheading(
            session,
            currentUserData.getSessionCode(),
            currentUserData.getOrCreateUserId()
        );

        elements.loadingSpinner.classList.add('hidden');
        elements.mainContainer.classList.remove('hidden');
    } else {
        console.log(`Updating session with current user's location`)
        await updateSession(
            currentUserData.getSessionCode(),
            currentUserData.getOrCreateUserId(),
            latitude,
            longitude
        );
        evaluateSession(session, latitude, longitude);
    }
    // Upon success, prompt user to share with friends
    elements.shareLinkBtn.classList.remove('hidden');
}

function shareLink() {
    if (currentUserData.getSessionCode()) {
        const url = `http://localhost:8888/?code=${currentUserData.getSessionCode()}`;
        navigator.clipboard.writeText(url);
    }
}

// Add event listeners to HTML elements
elements.getLocationBtn.addEventListener("click", processUserSessionInput);
elements.shareLinkBtn.addEventListener("click", shareLink);
elements.editLocationBtn.addEventListener('click', () => {
    elements.editLocationBtn.classList.add('hidden');
    elements.getLocationBtn.classList.remove('hidden');
});
