import { elements, displayPlaces } from './dom.js';
import { getSession, createSession, updateSession } from './api.js';
import { getLocation } from './geolocation.js';
import { CurrentUserData, calculateMidpoint } from './session.js';

// Load current user's browser data
var currentUserData = new CurrentUserData()
console.log(`Using session code: ${currentUserData.getSessionCode()}`)

// Get session data if available
if ( currentUserData.getSessionCode()) {
    console.log(`Reading session from database.`)
    var session = await getSession(currentUserData.getSessionCode())
    console.log(`Read session from database.`)
}

async function sessionLocationHandling() {
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

        console.log(`Fetching Nearby Places results.`)
        const placesData = await fetchData(`/.netlify/functions/google_maps_places_search?latitude=${midpoint.latitude}&longitude=${midpoint.longitude}`);
        displayPlaces(placesData);
    }
}

function shareLink() {
    if (sessionCode) {
        const url = `http://localhost:8888/?code=${currentUserData.getSessionCode()}`;
        navigator.clipboard.writeText(url);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    elements.getLocationBtn.addEventListener("click", sessionLocationHandling);
    elements.shareLinkBtn.addEventListener("click", shareLink);
});
