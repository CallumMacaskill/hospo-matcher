import { Dom } from './dom.js';
import { Meetup } from './meetup.js';
import { SessionData } from './session.js';
import { loadGoogleMapsApi, reverseGeocodeLocation } from './maps_platform.js';
import { generateCrudUrl } from './utils.js';

const baseURL = window.location.origin + "/";

var dom = new Dom();

// Load Maps Platform API and initialise Places autocomplete widget
const response = await fetch(`/.netlify/functions/read_maps_platform_value`);
const data = await response.json()
const open_sesame = data['open_sesame']

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
var meetup = new Meetup()

// Check if user is at the start of a flow
if (sessionData.getMeetupCode()) {
    console.log(`Using meetup code: ${sessionData.getMeetupCode()}`);
    const url = generateCrudUrl('/.netlify/functions/read_meetup', {
        code: sessionData.getMeetupCode()
    });
    const response = await fetch(url)
    var meetupDocument = await response.json()
    console.log(`Got meetup from database`)
    meetup.setNewState(meetupDocument);
}

// Define flow rules and data requirements for page elements
// TODO: This should follow a pattern but inter-dependencies make this them imperfect. Class heirarchy should be reviewed.
let featureRegistry = {
    flowChoice: {
        element: dom.elements.flowChoiceContainer,
        dataRequirements: ({ hasMeetupData, isManualFlow, isShareFlow }) => {
            return !hasMeetupData && !isManualFlow && !isShareFlow; // Hasn't joined meetup and hasn't chosen a flow
        }
    },
    description: {
        element: dom.elements.descriptionContainer,
        dataRequirements: ({ hasMeetupData, isManualFlow, isShareFlow, userId, userLocations }) => {
            return (
                (!hasMeetupData && !isManualFlow && !isShareFlow) // Hasn't joined meetup and hasn't chosen a flow
                || (hasMeetupData && !(userId in userLocations) // Joined meetup but hasn't added location
            ));
        }
    },
    context: {
        element: dom.elements.contextContainer,
        dataRequirements: ({hasMeetupData, userId, userLocations, numLocations}) => {
            console.log('bruh bruh')
            console.log(numLocations)
            return hasMeetupData && !(userId in userLocations) && numLocations > 0;
        },
        onShow: () => {
            // Data state shouldn't be recalculated. Tidy up in feature flag refactor.
            const userLocations = meetup.data ? meetup.data['user_locations'] : {};
            const numUsers = Object.keys(userLocations).length;
            const friendText = numUsers === 1 ? 'friend has' : 'friends have';
            const locationText = numUsers === 1 ? 'location' : 'locations';
            const text = `${numUsers} ${friendText} already added their ${locationText}`;
            dom.elements.contextText.innerText = text;
        }
    },
    meetupLocations: {
        element: dom.elements.locationsContainer,
        dataRequirements: ({ hasMeetupData, isManualFlow, userId, userLocations }) => {
            return (
                (hasMeetupData && isManualFlow) // Manual flow in progress
                || (hasMeetupData && userId in userLocations) // Joined meetup and added a location
            );
        },
        onShow: async () => {
            await generateMeetupLocations()
        }
    },
    locationInputs: {
        element: dom.elements.locationInputsContainer,
        dataRequirements: ({ hasMeetupData, isManualFlow, isShareFlow, userId, userLocations }) => {
            return (
                (!hasMeetupData && isManualFlow) // Starting manual flow
                || (!hasMeetupData && isShareFlow) // Starting share flow
                || (hasMeetupData && isManualFlow) // Manual flow in progress
                || (hasMeetupData && !(userId in userLocations) // Joined meetup but hasn't added location
            ));
        }
    },
    results: {
        element: dom.elements.resultsSection,
        dataRequirements: ({ hasMeetupData, isManualFlow, userId, userLocations, numLocations }) => {
            return (
                (hasMeetupData && isManualFlow && numLocations >= 2) // Manual flow in progress
                || (hasMeetupData && userId in userLocations && userLocations[userId].length > 0 && numLocations >= 2) // Joined meetup, submitted location, and enough meetup locations
            );
        },
        onShow: async () => {
            await meetup.evaluateResult(open_sesame);
            dom.updateMeetupResultElements(meetup)
        }
    },
    share: {
        element: dom.elements.shareContainer,
        dataRequirements: ({ hasMeetupData, isManualFlow, userId, userLocations }) => {
            return hasMeetupData && !isManualFlow && userId in userLocations && userLocations[userId].length > 0; // Joined meetup, not in manual flow, and submitted a location
        }
    },
};

await evaluateAndGenerateFeatures();

// Show main content and hide loading spinner
await dom.setLoadingVisibility(false)

async function evaluateAndGenerateFeatures() {
    // Define variables which determine element visibilities
    console.log('Creating variables for feature requirement checks')
    const userId = sessionData.getOrCreateUserId();
    const userLocations = meetup.data ? meetup.data['user_locations'] : {};
    const hasMeetupData = !!meetup.data;
    const isManualFlow = sessionStorage.getItem('manual_flow') === 'true';
    const isShareFlow = sessionStorage.getItem('share_flow') === 'true';
    const numLocations = meetup.data ? Object.values(userLocations).flat().length : 0;
    console.log(numLocations)
    console.log('bruh')

    // TODO: These blocks shouldn't exist. Use onShow for evaluating instruction.
    const chooseFlow = 'How would you like to add locations?';
    const startShareFlow = 'Start by adding your location';
    const shareInvited = 'Add your location';
    const share = 'Invite friends to add their locations';
    const startManualFlow = 'Add locations to find your midpoint';
    const manualFlowWithResults = 'Add more locations to find a new midpoint';
    let instructionText;

    if (!isShareFlow && !isManualFlow && !hasMeetupData) {
        instructionText = chooseFlow;
    } else if (isShareFlow && userId in userLocations) {
        instructionText = share;
    } else if (isShareFlow && !hasMeetupData) {
        instructionText = startShareFlow;
    } else if (isShareFlow && hasMeetupData) {
        instructionText = shareInvited;
    } else if ((isManualFlow && !hasMeetupData) || (isManualFlow && numLocations < 2)) {
        instructionText = startManualFlow;
    } else if (isManualFlow && hasMeetupData && numLocations >= 2) {
        instructionText = manualFlowWithResults;
    }
    dom.elements.instruction.innerHTML = instructionText;

    // Perform requirement checks on each element
    for (const [featureName, feature] of Object.entries(featureRegistry)) {
        console.log(`Checking data requirements for ${featureName}`);
        const shouldShow = feature.dataRequirements({ hasMeetupData, isManualFlow, isShareFlow, userId, userLocations, numLocations });
        console.log(`Showing ${feature.element.id}: ${shouldShow}`);

        if (shouldShow) {
            if (feature.onShow) await feature.onShow(); // Ensure async functions execute properly
            feature.element.classList.remove('hidden');
        } else {
            feature.element.classList.add('hidden');
        }
    }
}

async function generateMeetupLocations() {
    // Create flat version of user locations with user IDs added
    var allLocations = Object.entries(meetup.data['user_locations'])
    .flatMap(([userId, locations]) =>
        locations.map(location => ({
        ...location, // Spread the existing location object
        userId: userId // Add the userId as a new property
        }))
    );

    // Map each location to a promise that eventually fulfills with the address
    console.log(`Getting addresses of ${allLocations.length} meetup locations`)
    const promises = allLocations.map(async (location) => {
        const address = await reverseGeocodeLocation(location);
        return address;
    });

    // Wait for all promises to fulfill
    const addresses = await Promise.all(promises);

    // Add the address to the corresponding location in allLocations
    allLocations.forEach((location, index) => {
        location.formattedAddress = addresses[index];
    });

    // Show user's previous location inputs
    dom.populateLocationsList(sessionData.getMeetupCode(), sessionData.getOrCreateUserId(), allLocations)
}

async function processLocationInput(latitude, longitude, placeId) {
    console.log(`Processing location input: ${latitude}, ${longitude}, ${placeId}`)
    const MIN_LOADING_TIME = 300; // in milliseconds
    const timeStart = performance.now()

    dom.setLoadingVisibility(true)

    if (!sessionData.getMeetupCode()) {
        // Create a new meetup
        console.log('Creating new meetup')
        const url = generateCrudUrl('/.netlify/functions/create_meetup', {
            userId: sessionData.getOrCreateUserId(),
            latitude: latitude,
            longitude: longitude,
            placeId: placeId,
        });

        const response = await fetch(url);
        const data = await response.json()

        // Update current data with new meetup
        meetupDocument = data['meetup']
        console.log(`Created new meetup #${meetupDocument['code']} in database`)

        sessionData.setMeetupCode(meetupDocument['code'])
        meetup.setNewState(meetupDocument);

        // Update browser URL
        const newUrl = `${window.location.origin}${window.location.pathname}?code=${sessionData.getMeetupCode()}`;
        history.replaceState(null, "", newUrl);
        console.log('Updated browser URL')

    } else {
        // Update existing meetup
        console.log(`Adding location to existing meetup`)
        const url = generateCrudUrl('/.netlify/functions/add_meetup_location', {
            code: sessionData.getMeetupCode(),
            userId: sessionData.getOrCreateUserId(),
            latitude: latitude,
            longitude: longitude,
            placeId: placeId
        });
        const response = await fetch(url);
        const data = await response.json();
        console.log('Updated meetup in database')
        meetupDocument = data['meetup'];
        meetup.setNewState(meetupDocument);
    }

    await evaluateAndGenerateFeatures()

    // Artificial wait time to smooth animations if necessary
    const timeElapsed = performance.now() - timeStart;
    const timeRemaining = MIN_LOADING_TIME - timeElapsed;
    if (timeRemaining > 0) {
        console.log(`Waiting additional ${timeRemaining}ms.`);
        await new Promise((resolve) => setTimeout(resolve, timeRemaining));
    }

    dom.setLoadingVisibility(false)
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

async function setFlow(flowName) {
    console.log(`Setting ${flowName} to ${true}`)
    sessionStorage.setItem(flowName, true);
    await dom.setLoadingVisibility(true)
    location.reload()
}

function shareLink() {
    // Require active meetup code to share link
    if (sessionData.getMeetupCode()) {
        const url = `${baseURL}?code=${sessionData.getMeetupCode()}`;

        // Copy link to clipboard
        navigator.clipboard.writeText(url).then(() => {
            dom.invertButtonStyling(dom.elements.shareLinkBtn, 'Share Meetup')
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }
}

function shareAddress() {
    // Copy link to clipboard
    navigator.clipboard.writeText(meetup.resultAddress).then(() => {
        dom.invertButtonStyling(dom.elements.shareMidpointBtn, meetup.resultAddress)
    }).catch(err => {
        console.error('Failed to copy text:', err);
    });
}

// Create button event listeners
dom.elements.manualFlowBtn.addEventListener("click", () => setFlow("manual_flow"));
dom.elements.shareFlowBtn.addEventListener("click", () => setFlow("share_flow"));
dom.elements.getLocationBtn.addEventListener("click", getCurrentLocationHandler);
dom.elements.shareContainer.addEventListener("click", shareLink);
dom.elements.shareMidpointBtn.addEventListener("click", shareAddress);
