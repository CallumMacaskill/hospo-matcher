import { Dom } from './dom.js';
import { FeatureFlowChoice, FeatureDescription, FeatureContext, FeatureMeetupLocations, FeatureInstruction, FeatureLocationInputs, FeatureResults, FeatureShare, evaluateFeatures } from './features.js'
import { Meetup } from './meetup.js';
import { SessionData } from './session.js';
import { loadGoogleMapsApi, getCountryFromIP } from './maps.js';
import { generateCrudUrl } from './utils.js';

const baseURL = window.location.origin + "/";

var dom = new Dom();

// Load Maps Platform API and initialise Places autocomplete widget
const response = await fetch(`/.netlify/functions/read_maps_platform_value`);
const data = await response.json();
const maps_open_sesame = data['maps_open_sesame'];
const ip_open_sesame = data['ip_open_sesame'];

const country = await getCountryFromIP(ip_open_sesame);
await loadGoogleMapsApi(maps_open_sesame);
const placeAutocomplete = dom.initializeAutocomplete(country);

// Get Place coordinates on selection, and display the results.
placeAutocomplete.addEventListener("gmp-placeselect", async ({ place }) => {
    // Disable other location input button
    dom.elements.getLocationBtn.disabled = true;

    await place.fetchFields({
        fields: ["location"],
    });

    // Trigger input processing
    await processLocationInput(place.location.lat(), place.location.lng(), place.id)
    dom.elements.getLocationBtn.disabled = false;
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

const featureRegistry = {
    flowChoice: new FeatureFlowChoice(dom.elements.flowChoiceContainer),
    description: new FeatureDescription(dom.elements.descriptionContainer),
    context: new FeatureContext(dom.elements.contextContainer, dom.elements.contextText),
    meetupLocations: new FeatureMeetupLocations(dom.elements.locationsContainer),
    instruction: new FeatureInstruction(dom.elements.instruction),
    locationInputs: new FeatureLocationInputs(dom.elements.locationInputsContainer, dom.elements.geolocationError),
    results: new FeatureResults(dom.elements.resultsSection, maps_open_sesame),
    share: new FeatureShare(dom.elements.shareContainer),
}

await updatePage(featureRegistry, meetup, dom);

// Show main content and hide loading spinner
await dom.setLoadingVisibility(false)

function evaluateFlowState(meetup) {
    // Define variables which determine element visibilities
    console.log('Creating variables for feature requirement checks')
    const userId = sessionData.getOrCreateUserId();
    const userLocations = meetup.data ? meetup.data['user_locations'] : {};
    const hasMeetupData = !!meetup.data;
    const isManualFlow = sessionStorage.getItem('manual_flow') === 'true';
    const isShareFlow = sessionStorage.getItem('share_flow') === 'true';
    const numUsers = Object.keys(userLocations).length;
    const numLocations = meetup.data ? Object.values(userLocations).flat().length : 0;
    return { hasMeetupData, isManualFlow, isShareFlow, userId, userLocations, numUsers, numLocations };
}

async function updatePage(featureRegistry, meetup, dom) {
    const featureVariableMapping = new Map(); // Use a Map for better instance-based lookup
    featureVariableMapping.set(featureRegistry.results, { 
        meetup: meetup, 
        dom: dom,
    });
    featureVariableMapping.set(featureRegistry.meetupLocations, {
        meetupCode: meetup.data ? meetup.data["code"] : null,
        dom: dom,
    });

    const flowStateData = evaluateFlowState(meetup)
    await evaluateFeatures(featureRegistry, flowStateData, featureVariableMapping)
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

    await updatePage(featureRegistry, meetup, dom);

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
    await dom.setLoadingVisibility(true);
    
    if (!navigator.geolocation) {
        dom.showGeolocationPermissionsError(new Error("Geolocation not supported"));
        await dom.setLoadingVisibility(false);
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            await processLocationInput(position.coords.latitude, position.coords.longitude);
        },
        async (error) => {
            dom.showGeolocationPermissionsError(error);
            await dom.setLoadingVisibility(false);
        }
    );
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

async function resetFlow() {
    await dom.setLoadingVisibility(true)
    sessionStorage.removeItem("manual_flow");
    sessionStorage.removeItem("share_flow");
    window.location.href = "/";
}

// Create button event listeners
dom.elements.pageHeadingBtn.addEventListener("click", () => resetFlow());
dom.elements.manualFlowBtn.addEventListener("click", () => setFlow("manual_flow"));
dom.elements.shareFlowBtn.addEventListener("click", () => setFlow("share_flow"));
dom.elements.getLocationBtn.addEventListener("click", getCurrentLocationHandler);
dom.elements.shareContainer.addEventListener("click", shareLink);
dom.elements.shareMidpointBtn.addEventListener("click", shareAddress);
