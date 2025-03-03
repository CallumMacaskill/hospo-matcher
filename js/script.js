import { elements, evaluatePageSubheading, generatePlacesElements, invertShareLinkStyling, invertShareAddressStyling, setVisibility, setLoadingVisibility, initializeAutocomplete, populateAddressList } from './dom.js';
import { loadGoogleMapsApi, reverseGeocodeLocation, searchNearbyPlaces } from './maps_platform.js';
import { CurrentUserData, calculateMidpoint, generateCrudUrl } from './meetup.js';

const baseURL = window.location.origin + "/";
console.log(baseURL)

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
const placeAutocomplete = initializeAutocomplete();

// Get Place coordinates on selection, and display the results.
placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
    await place.fetchFields({
        fields: ["location"],
    });

    // Trigger input processing
    await processLocationInput(place.location.lat(), place.location.lng(), place.id)
});

// Load current user's browser data
var currentUserData = new CurrentUserData()
console.log(`Using meetup code: ${currentUserData.getMeetupCode()}`)

// Get meetup data if available
if (currentUserData.getMeetupCode()) {
    console.log(`Reading meetup from database.`)
    const url = generateCrudUrl('/.netlify/functions/read_meetup', {
        code: currentUserData.getMeetupCode()
    });
    console.log(`Generated url: ${url}`)
    const response = await fetch(url)
    var meetup = await response.json()
    console.log(`Read meetup from database.`)
}

// Check if user has already submitted location
if (meetup) {
    const userId = currentUserData.getOrCreateUserId();
    const userLocations = meetup['user_coordinates'][userId];
    if (userLocations && userLocations.length > 0) {
        console.log(`User locations length: ${userLocations.length}`)

        await generateInputList(userLocations)

        elements.shareLinkBtn.classList.remove('hidden');

        // Calculate midpoint, show results, show link button
        await evaluateMeetupResult(meetup)
        elements.resultsSection.classList.add("show")
    }
}

// Generate a contextualised description based on data inputs
evaluatePageSubheading(
    meetup,
    currentUserData.getMeetupCode(),
    currentUserData.getOrCreateUserId()
);

// Show main content and hide loading spinner
setLoadingVisibility(false)

async function evaluateMeetupResult(meetup) {
    let midpointResult = "Only one location submitted. Add more or invite friends to find your midpoint."

    // Calculate the number of locations submitted
    const numLocations = Object.values(meetup.user_coordinates).reduce((sum, list) => sum + list.length, 0);
    console.log(numLocations)

    if (numLocations > 1) {
        // Calculate midpoint coordinates
        console.log('Calculating midpoint of all meetup users.')
        const midpoint = calculateMidpoint(meetup, numLocations);
        console.log(`Calculated midpoint: ${midpoint.latitude}, ${midpoint.longitude}`)

        // Update midpoint element text
        midpointResult = `Your midpoint between ${numLocations} locations`;

        // Populate button with address from coordinates
        const address = await reverseGeocodeLocation(midpoint);
        elements.shareMidpointBtn.innerHTML = address
        elements.shareMidpointBtn.classList.add('show')

        // Search nearby Places
        console.log(`Fetching Nearby Places results.`)
        const placesData = await searchNearbyPlaces(midpoint, open_sesame);
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
    populateAddressList(currentUserData.getMeetupCode(), currentUserData.getOrCreateUserId(), userLocations, addresses)
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

    setLoadingVisibility(true)

    if (!currentUserData.getMeetupCode()) {
        // Create a new meetup
        console.log('Creating new meetup.')
        const url = generateCrudUrl('/.netlify/functions/create_meetup', {
            userId: currentUserData.getOrCreateUserId(),
            latitude: latitude,
            longitude: longitude,
            placeId: placeId,
        });
        console.log(`Generated url: ${url}`);

        const response = await fetch(url);
        console.log('Created new meetup')

        // Update current data with new meetup
        const data = await response.json()
        meetup = data['meetup']
        currentUserData.setMeetupCode(meetup['code'])

        // Update browser URL
        const newUrl = `${window.location.origin}${window.location.pathname}?code=${currentUserData.getMeetupCode()}`;
        history.replaceState(null, "", newUrl);

    } else {
        // Update existing meetup
        console.log(`Adding current user's new location input to meetup`)
        const url = generateCrudUrl('/.netlify/functions/add_meetup_location', {
            code: currentUserData.getMeetupCode(),
            userId: currentUserData.getOrCreateUserId(),
            latitude: latitude,
            longitude: longitude,
            placeId: placeId
        });
        const response = await fetch(url)
        const data = await response.json()
        meetup = data['meetup']
    }

    // Update page subheading
    evaluatePageSubheading(
        meetup,
        currentUserData.getMeetupCode(),
        currentUserData.getOrCreateUserId()
    );

    // Evaluate meetup, getting results if possible.
    await evaluateMeetupResult(meetup);

    // Show user's previous location inputs
    await generateInputList(meetup["user_coordinates"][currentUserData.getOrCreateUserId()])

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
    // Require active meetup code to share link
    if (currentUserData.getMeetupCode()) {
        const url = `${baseURL}?code=${currentUserData.getMeetupCode()}`;

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
