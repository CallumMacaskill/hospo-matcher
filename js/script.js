import { elements, refreshPageSubheading, generatePlacesElements, invertShareLinkStyling, setVisibility, setLoadingVisibility } from './dom.js';
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
        elements.shareLinkBtn.classList.remove('hidden');

        // Calculate midpoint, show results, show link button
        evaluateSession(session)
        elements.resultsContainer.classList.add("show")
    }
}

// Generate a contextualised description based on data inputs
refreshPageSubheading(
    session,
    currentUserData.getSessionCode(),
    currentUserData.getOrCreateUserId()
);

// Show main content and hide loading spinner
setLoadingVisibility(false)

async function evaluateSession(session) {
    let midpointResult = "Only one location submitted. Invite friends to find your midpoint."
    const numLocations = Object.keys(session['user_coordinates']).length
    if (numLocations > 1) {
        console.log('Calculating midpoint of all session users.')
        const midpoint = calculateMidpoint(session);
        console.log(`Calculated midpoint: ${midpoint.latitude}, ${midpoint.longitude}`)

        // Update midpoint element text
        midpointResult = `Your meetup midpoint between ${numLocations} locations is ${midpoint.latitude}, ${midpoint.longitude}`;

        console.log(`Fetching Nearby Places results.`)
        const placesData = await fetchData(`/.netlify/functions/google_maps_places_search?latitude=${midpoint.latitude}&longitude=${midpoint.longitude}`);
        generatePlacesElements(placesData);
    }
    elements.midpointText.innerText = midpointResult;
}

async function processUserSessionInput() {
    const MIN_LOADING_TIME = 300; // in milliseconds

    const { latitude, longitude } = await getLocation();
    console.log(`Loaded coordinates: ${latitude}, ${longitude}`)

    const timeStart = performance.now()

    setLoadingVisibility(true)

    if (!currentUserData.getSessionCode()) {
        console.log('Creating new session.')
        const response = await createSession(currentUserData.getOrCreateUserId(), latitude, longitude);
        console.log('Created new session')

        // Update current data with new session values
        session = response['session']
        currentUserData.setSessionCode(session['code'])

        // Update page context after creating session
        refreshPageSubheading(
            session,
            currentUserData.getSessionCode(),
            currentUserData.getOrCreateUserId()
        );

    } else {
        console.log(`Updating session with current user's location`)
        const response = await updateSession(
            currentUserData.getSessionCode(),
            currentUserData.getOrCreateUserId(),
            latitude,
            longitude
        );
        session = response['session']
        evaluateSession(session);
    }

    // Artificial wait time to smooth animations if necessary
    const timeElapsed = performance.now() - timeStart;
    const timeRemaining = MIN_LOADING_TIME - timeElapsed;
    if ( timeRemaining > 0 ) {
        console.log(`Waiting additional ${timeRemaining}ms.`);
        await new Promise((resolve) => setTimeout(resolve, timeRemaining));
    }

    // Upon success, prompt user to share with friends
    elements.shareLinkBtn.classList.remove('hidden');
    elements.resultsContainer.classList.add('show');
    setLoadingVisibility(false)
}

function shareLink() {
    // Require active session code to share link
    if (currentUserData.getSessionCode()) {
        const url = `http://localhost:8888/?code=${currentUserData.getSessionCode()}`;

        // Copy link to clipboard
        navigator.clipboard.writeText(url).then(() => {
            invertShareLinkStyling()
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }
}

// Add event listeners to HTML elements
elements.getLocationBtn.addEventListener("click", processUserSessionInput);
elements.shareLinkBtn.addEventListener("click", shareLink);
elements.editLocationBtn.addEventListener('click', () => {
    elements.editLocationBtn.classList.add('hidden');
    elements.getLocationBtn.classList.remove('hidden');
});
