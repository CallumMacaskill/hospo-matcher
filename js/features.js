import { reverseGeocodeLocation } from "./maps_platform.js";

class FeatureBase {

    constructor(element) {
        console.log(`Creating feature for element ${element.id}`)
        this.element = element;
    }

    shouldShow() {
        throw new Error("shouldShow(state) must be implemented by subclasses");
    }

    async onShow() {
        // Optional: Subclasses can override this
    }
};

export class FeatureFlowChoice extends FeatureBase {
    constructor(element) {
        super(element);
    }

    shouldShow({ hasMeetupData, isManualFlow, isShareFlow }) {
        return !hasMeetupData && !isManualFlow && !isShareFlow; // Hasn't joined meetup and hasn't chosen a flow
    }
}

export class FeatureDescription extends FeatureBase {
    constructor(element) {
        super(element);
    }

    shouldShow({ hasMeetupData, isManualFlow, isShareFlow, userId, userLocations }) {
        return (
            (!hasMeetupData && !isManualFlow && !isShareFlow) // Hasn't joined meetup and hasn't chosen a flow
            || (hasMeetupData && !(userId in userLocations) // Joined meetup but hasn't added location
            ));
    }
}

export class FeatureContext extends FeatureBase {
    constructor(element, contextTextElement) {
        super(element);
        this.contextTextElement = contextTextElement;
    }

    shouldShow({ hasMeetupData, userId, userLocations, numLocations }) {
        return hasMeetupData && !(userId in userLocations) && numLocations > 0;
    }

    onShow({ numUsers }) {
        const friendText = numUsers === 1 ? 'friend has' : 'friends have';
        const locationText = numUsers === 1 ? 'location' : 'locations';
        const text = `${numUsers} ${friendText} already added their ${locationText}`;
        console.log(`Content text is '${text}'`)
        this.contextTextElement.innerText = text;
    }
}

export class FeatureMeetupLocations extends FeatureBase {
    constructor(element) {
        super(element);
    }

    shouldShow({ numLocations, hasMeetupData, isManualFlow, userId, userLocations }) {
        return (
            (numLocations >= 1 && isManualFlow) // Manual flow in progress
            || (hasMeetupData && userId in userLocations) // Joined meetup and added a location
        );
    }

    async onShow({ userId, userLocations }, { meetupCode, dom }) {
        console.log(`Using param: ${meetupCode}`)
        // Create flat version of user locations with user IDs added
        var allLocations = Object.entries(userLocations)
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
        dom.populateLocationsList(meetupCode, userId, allLocations)
    }
}

export class FeatureInstruction extends FeatureBase {
    constructor(element) {
        super(element);
        this.chooseFlow = 'How would you like to add locations?';
        this.startShareFlow = 'Start by adding your location';
        this.shareInvited = 'Add your location';
        this.share = 'Invite friends to add their locations';
        this.startManualFlow = 'Add locations to find your midpoint';
        this.manualFlowWithResults = 'Add more locations to find a new midpoint';
    }

    shouldShow() {
        return true;
    }

    onShow({ isShareFlow, isManualFlow, hasMeetupData, numLocations, userId, userLocations }) {
        var instructionText = "";
        if (!isShareFlow && !isManualFlow && !hasMeetupData) {
            instructionText = this.chooseFlow;
        } else if (!isManualFlow && userId in userLocations) {
            instructionText = this.share;
        } else if (isShareFlow && !hasMeetupData) {
            instructionText = this.startShareFlow;
        } else if (!isShareFlow && !isManualFlow && hasMeetupData) {
            instructionText = this.shareInvited;
        } else if ((isManualFlow && !hasMeetupData) || (isManualFlow && numLocations < 2)) {
            instructionText = this.startManualFlow;
        } else if (isManualFlow && hasMeetupData && numLocations >= 2) {
            instructionText = this.manualFlowWithResults;
        }
        this.element.innerText = instructionText;
    }
}

export class FeatureLocationInputs extends FeatureBase {
    constructor(element) {
        super(element);
    }

    shouldShow({ hasMeetupData, isManualFlow, isShareFlow, userId, userLocations }) {
        return (
            (!hasMeetupData && isManualFlow) // Starting manual flow
            || (!hasMeetupData && isShareFlow) // Starting share flow
            || (hasMeetupData && isManualFlow) // Manual flow in progress
            || (hasMeetupData && !(userId in userLocations) // Joined meetup but hasn't added location
            ));
    }
}

export class FeatureResults extends FeatureBase {
    constructor(element, open_sesame) {
        super(element);
        this.open_sesame = open_sesame;
    }

    shouldShow({ hasMeetupData, isManualFlow, userId, userLocations, numLocations }) {
        return (
            (hasMeetupData && isManualFlow && numLocations >= 2) // Manual flow in progress
            || (hasMeetupData && userId in userLocations && userLocations[userId].length > 0 && numLocations >= 2) // Joined meetup, submitted location, and enough meetup locations
        );
    }

    async onShow({ }, { meetup, dom }) {
        await meetup.evaluateResult(this.open_sesame);
        dom.updateMeetupResultElements(meetup);
    }
}

export class FeatureShare extends FeatureBase {
    constructor(element) {
        super(element);
    }

    shouldShow({ hasMeetupData, isManualFlow, userId, userLocations }) {
        return hasMeetupData && !isManualFlow && userId in userLocations; // Joined meetup, not in manual flow, and submitted a location
    }
}

export async function evaluateFeatures(features, flowStateData, featureVariableMapping) {
    // Perform requirement checks on each element
    for (const feature of Object.values(features)) {
        console.log(`Checking data requirements for ${feature.element.id}`);
        const shouldShow = feature.shouldShow(flowStateData);
        console.log(`Showing ${feature.element.id}: ${shouldShow}`);

        if (shouldShow) {
            if (feature.onShow) {
                const extraArgs = featureVariableMapping.get(feature) || {}; // Default to empty object
                await feature.onShow(flowStateData, extraArgs);
            }
            feature.element.classList.remove('hidden');
        } else {
            feature.element.classList.add('hidden');
        }
    }
}
