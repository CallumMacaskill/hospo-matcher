import { elements, refreshPageSubheading, generatePlacesElements, invertShareLinkStyling, invertShareAddressStyling, setVisibility, setLoadingVisibility, initializeAutocomplete, populateAddressList } from './dom.js';
import { getSession, createSession, addSessionLocation, getMapsPlatformValue, loadGoogleMapsApi } from './api.js';
import { getLocation, reverseGeocodeLocation } from './geolocation.js';
import { CurrentUserData, calculateMidpoint } from './session.js';
import { fetchData } from './utils.js';
console.log('o')

// Load Maps Platform API
const response = await getMapsPlatformValue();
await loadGoogleMapsApi(response['open_sesame']);

// Initialise autocomplete widget
const placeAutocomplete = initializeAutocomplete();

// Add the gmp-placeselect listener, and display the results.
placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
    await place.fetchFields({
        fields: ["location"],
    });
    console.log(`Selected place: ${JSON.stringify(place.toJSON())}`)

    // Trigger input processing
    await processLocationInput(place.location.lat(), place.location.lng(), place.id)
});

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
    const userId = currentUserData.getOrCreateUserId();
    const userLocations = session['user_coordinates'][userId];

    if (userLocations && userLocations.length > 0) {
        console.log(`User locations length: ${userLocations.length}`)

        await generateInputList(userLocations)

        elements.shareLinkBtn.classList.remove('hidden');

        // Calculate midpoint, show results, show link button
        await evaluateSession(session)
        elements.resultsSection.classList.add("show")
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
console.log('Showing main')

async function evaluateSession(session) {
    let midpointResult = "Only one location submitted. Add more or invite friends to find your midpoint."

    // Calculate the number of locations submitted
    const numLocations = Object.values(session.user_coordinates).reduce((sum, list) => sum + list.length, 0);
    console.log(numLocations)

    if (numLocations > 1) {
        // Calculate midpoint coordinates
        console.log('Calculating midpoint of all session users.')
        const midpoint = calculateMidpoint(session, numLocations);
        console.log(`Calculated midpoint: ${midpoint.latitude}, ${midpoint.longitude}`)

        // Update midpoint element text
        midpointResult = `Your midpoint between ${numLocations} locations`;

        // Populate button with address from coordinates
        const address = await reverseGeocodeLocation(midpoint);
        elements.shareMidpointBtn.innerHTML = address
        elements.shareMidpointBtn.classList.add('show')

        console.log(`Fetching Nearby Places results.`)
        const placesData = await fetchData(`/.netlify/functions/google_maps_places_search?latitude=${midpoint.latitude}&longitude=${midpoint.longitude}`);
        generatePlacesElements(placesData);
        elements.placesText.classList.add('show')
    }
    elements.midpointText.innerText = midpointResult;
}

async function generateInputList(userLocations) {
    // Map each userId to a promise that eventually fulfills with the address
    const promises = userLocations.map(async (location) => {
        const address = await reverseGeocodeLocation(location);
        return address;
    });
    
    // Wait for all promises to fulfill
    const addresses = await Promise.all(promises);

    // Show user's previous location inputs
    populateAddressList(currentUserData.getSessionCode(), currentUserData.getOrCreateUserId(), userLocations, addresses)
}

async function getCurrentLocationHandler() {
    const { latitude, longitude } = await getLocation();
    processLocationInput(latitude, longitude);
}

async function processLocationInput(latitude, longitude, placeId) {
    const MIN_LOADING_TIME = 300; // in milliseconds
    const timeStart = performance.now()

    setLoadingVisibility(true)

    if (!currentUserData.getSessionCode()) {
        console.log('Creating new session.')
        const response = await createSession(currentUserData.getOrCreateUserId(), latitude, longitude, placeId);
        console.log('Created new session')

        // Update current data with new session values
        session = response['session']
        currentUserData.setSessionCode(session['code'])

        const newUrl = `${window.location.origin}${window.location.pathname}?code=${currentUserData.getSessionCode()}`;
        history.replaceState(null, "", newUrl);

        // Update page context after creating session
        refreshPageSubheading(
            session,
            currentUserData.getSessionCode(),
            currentUserData.getOrCreateUserId()
        );

        elements.midpointText.innerText = "Only one location submitted. Add more or invite friends to find your midpoint.";

    } else {
        console.log(`Adding current user's new location input to session`)
        const response = await addSessionLocation(
            currentUserData.getSessionCode(),
            currentUserData.getOrCreateUserId(),
            latitude,
            longitude,
            placeId
        );
        session = response['session']

        await evaluateSession(session);
    }

    // Show user's previous location inputs
    await generateInputList(session["user_coordinates"][currentUserData.getOrCreateUserId()])

    // Artificial wait time to smooth animations if necessary
    const timeElapsed = performance.now() - timeStart;
    const timeRemaining = MIN_LOADING_TIME - timeElapsed;
    if (timeRemaining > 0) {
        console.log(`Waiting additional ${timeRemaining}ms.`);
        await new Promise((resolve) => setTimeout(resolve, timeRemaining));
    }

    // Upon success, prompt user to share with friends
    elements.shareLinkBtn.classList.remove('hidden');
    elements.resultsSection.classList.add('show');
    setLoadingVisibility(false)
}

function shareLink() {
    // Require active session code to share link
    if (currentUserData.getSessionCode()) {
        const url = `https://hospomatcher.netlify.app/?code=${currentUserData.getSessionCode()}`;

        // Copy link to clipboard
        navigator.clipboard.writeText(url).then(() => {
            invertShareLinkStyling()
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }
}

function shareAddress() {
    // Copy link to clipboard
    navigator.clipboard.writeText(elements.shareMidpointBtn.textContent).then(() => {
        invertShareAddressStyling()
    }).catch(err => {
        console.error('Failed to copy text:', err);
    });
}

// Add event listeners to HTML elements
elements.getLocationBtn.addEventListener("click", getCurrentLocationHandler);
elements.shareLinkBtn.addEventListener("click", shareLink);
elements.shareMidpointBtn.addEventListener("click", shareAddress);
