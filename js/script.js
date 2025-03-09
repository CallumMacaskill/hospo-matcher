import { Dom } from './dom.js';
import { Meetup } from './meetup.js';
import { SessionData } from './session.js';
import { loadGoogleMapsApi, reverseGeocodeLocation } from './maps_platform.js';
import { generateCrudUrl } from './utils.js';

const baseURL = window.location.origin + "/";
console.log(baseURL)

var dom = new Dom();

// Load Maps Platform API and initialise Places autocomplete widget
let open_sesame;
if (baseURL === 'http://localhost:8888/') {
    open_sesame = prompt();
} else {
    const response = await fetch(`/.netlify/functions/read_maps_platform_value`);
    const data = response.json()
    open_sesame = data['open_sesame']
}

await loadGoogleMapsApi(open_sesame);
const placeAutocomplete = dom.initializeAutocomplete();

// Get Place coordinates on selection, and display the results.
placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
    await place.fetchFields({
        fields: ["location"],
    });

    // Trigger input processing
    await processLocationInput(place.location.lat(), place.location.lng(), place.id)
});

// Load current user's browser data
var sessionData = new SessionData()
console.log(`Using meetup code: ${sessionData.getMeetupCode()}`);
var meetup = new Meetup();

// Get meetup data if available
if (sessionData.getMeetupCode()) {
    console.log(`Reading meetup from database.`)
    const url = generateCrudUrl('/.netlify/functions/read_meetup', {
        code: sessionData.getMeetupCode()
    });
    console.log(`Generated url: ${url}`)
    const response = await fetch(url)
    var meetupDocument = await response.json()
    console.log(`Read meetup from database.`)

    meetup.setNewState(meetupDocument);
    console.log('Created meetup obj')
}
console.log(meetup)

// Check if user has already submitted location.
if (meetup.getData()) {
    const userId = sessionData.getOrCreateUserId();
    const userLocations = meetup.getData()['user_coordinates'][userId];
    if (userLocations && userLocations.length > 0) {
        console.log(`User locations length: ${userLocations.length}`)

        await generateInputList(userLocations)

        dom.elements.shareLinkBtn.classList.remove('hidden');

        // Calculate midpoint, show results, show link button
        await meetup.evaluateResult(open_sesame);

        dom.updateMeetupResultElements(meetup)
    }
}

// Generate a contextualised description based on data inputs
const subheading = meetup.evaluatePageSubheading(
    sessionData.getMeetupCode(),
    sessionData.getOrCreateUserId()
);
console.log(subheading);
dom.elements.pageDescription.textContent = subheading;

// Show main content and hide loading spinner
dom.setLoadingVisibility(false)

async function generateInputList(userLocations) {
    // Map each userId to a promise that eventually fulfills with the address
    const promises = userLocations.map(async (location) => {
        const address = await reverseGeocodeLocation(location);
        return address;
    });
    
    // Wait for all promises to fulfill
    const addresses = await Promise.all(promises);

    // Show user's previous location inputs
    dom.populateAddressList(sessionData.getMeetupCode(), sessionData.getOrCreateUserId(), userLocations, addresses)
}

async function getCurrentLocationHandler() {
    const { latitude, longitude } = await new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => reject(error)
            );
        } else {
            reject(new Error("Geolocation not supported"));
        }
    });
    processLocationInput(latitude, longitude);
}

async function processLocationInput(latitude, longitude, placeId) {
    const MIN_LOADING_TIME = 300; // in milliseconds
    const timeStart = performance.now()

    dom.setLoadingVisibility(true)

    if (!sessionData.getMeetupCode()) {
        // Create a new meetup
        console.log('Creating new meetup.')
        const url = generateCrudUrl('/.netlify/functions/create_meetup', {
            userId: sessionData.getOrCreateUserId(),
            latitude: latitude,
            longitude: longitude,
            placeId: placeId,
        });
        console.log(`Generated url: ${url}`);

        const response = await fetch(url);
        console.log('Created new meetup')

        // Update current data with new meetup
        const data = await response.json()
        meetupDocument = data['meetup']
        sessionData.setMeetupCode(meetupDocument['code'])
        meetup.setNewState(meetupDocument);

        // Update browser URL
        const newUrl = `${window.location.origin}${window.location.pathname}?code=${sessionData.getMeetupCode()}`;
        history.replaceState(null, "", newUrl);

    } else {
        // Update existing meetup
        console.log(`Adding current user's new location input to meetup`)
        const url = generateCrudUrl('/.netlify/functions/add_meetup_location', {
            code: sessionData.getMeetupCode(),
            userId: sessionData.getOrCreateUserId(),
            latitude: latitude,
            longitude: longitude,
            placeId: placeId
        });
        const response = await fetch(url);
        const data = await response.json();
        meetupDocument = data['meetup'];
        meetup.setNewState(meetupDocument);
    }

    // Update page subheading with new context
    const subheading = meetup.evaluatePageSubheading(
        sessionData.getMeetupCode(),
        sessionData.getOrCreateUserId()
    );
    dom.elements.pageDescription.textContent = subheading;

    // Evaluate meetup, getting results if possible.
    await meetup.evaluateResult(open_sesame);

    // Show user's previous location inputs
    await generateInputList(meetup.data.user_coordinates[sessionData.getOrCreateUserId()])

    dom.updateMeetupResultElements(meetup)

    // Artificial wait time to smooth animations if necessary
    const timeElapsed = performance.now() - timeStart;
    const timeRemaining = MIN_LOADING_TIME - timeElapsed;
    if (timeRemaining > 0) {
        console.log(`Waiting additional ${timeRemaining}ms.`);
        await new Promise((resolve) => setTimeout(resolve, timeRemaining));
    }

    // Upon success, prompt user to share with friends
    dom.elements.shareLinkBtn.classList.remove('hidden');
    dom.elements.resultsSection.classList.add('show');
    dom.setLoadingVisibility(false)
}

function shareLink() {
    // Require active meetup code to share link
    if (sessionData.getMeetupCode()) {
        const url = `${baseURL}?code=${sessionData.getMeetupCode()}`;

        // Copy link to clipboard
        navigator.clipboard.writeText(url).then(() => {
            dom.invertShareLinkStyling()
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }
}

function shareAddress() {
    // Copy link to clipboard
    // TODO: Use state from sessionData instead of button
    navigator.clipboard.writeText(meetup.resultAddress).then(() => {
        dom.invertShareAddressStyling()
    }).catch(err => {
        console.error('Failed to copy text:', err);
    });
}

// Add event listeners to HTML elements
dom.elements.getLocationBtn.addEventListener("click", getCurrentLocationHandler);
dom.elements.shareLinkBtn.addEventListener("click", shareLink);
dom.elements.shareMidpointBtn.addEventListener("click", shareAddress);
