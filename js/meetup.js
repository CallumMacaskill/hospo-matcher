import { reverseGeocodeLocation, searchNearbyPlaces } from './maps.js';

export class Meetup {
    constructor(data) {
        this.setNewState(data)
    }

    setNewState(data) {
        this.data = data;
        this.resultMessage = null;
        this.resultLocation = null;
        this.resultAddress = null;
        this.nearbyPlaces = null;
        console.log('Set new state to meetup')
    }

    calculateMidpoint(numLocations) {
        if (!this.data) {
            throw new Error("Invalid inputs for calculating midpoint.");
        }
    
        let totalLatitude = 0;
        let totalLongitude = 0;
    
        // Iterate through the lists and accumulate latitude and longitude values
        Object.values(this.data['user_locations']).forEach(list => {
            list.forEach(coord => {
                if (coord.latitude && coord.longitude) {
                    totalLatitude += parseFloat(coord.latitude);
                    totalLongitude += parseFloat(coord.longitude);
                }
            });
        });
    
        this.resultLocation = {
            latitude: totalLatitude / numLocations,
            longitude: totalLongitude / numLocations,
        };
        console.log(`Calculated midpoint ${this.resultLocation.latitude}, ${this.resultLocation.longitude}`)
    }

    async evaluateResult(open_sesame) {
        console.log('Evaluating result')    
        // Calculate the number of locations submitted
        const numLocations = Object.values(this.data.user_locations).reduce((sum, list) => sum + list.length, 0);
    
        if (numLocations > 1) {
            // Calculate midpoint coordinates
            this.calculateMidpoint(numLocations);
    
            // Update midpoint element text
            this.resultMessage = `Your midpoint between ${numLocations} locations`;
    
            const address = await reverseGeocodeLocation(this.resultLocation);
            this.resultAddress = address
    
            // Search nearby Places
            this.nearbyPlaces = await searchNearbyPlaces(this.resultLocation, open_sesame);
        }
    }

    evaluateContextHeading(code, userId) {
        // Generate contextualised page description
        var page_description = 'Starting a new meetup'
        if (this.data) {
            const code_substring = code.substring(0, 6);
    
            // Check if user has already submitted location
            const userLocations = this.data['user_locations'][userId];
            if (userLocations && userLocations.length > 0) {
                page_description = `You've joined meetup #${code_substring}`;
            } else {
                page_description = `You're joining meetup #${code_substring}`;
            }
        }
        console.log(`Evaluated page description: ${page_description}`)
        return page_description;
    }

    evaluateContextText(userId) {
        let subheading = 'Add a location to start a new meetup';
        if (this.data) {
            // Calculate values
            let otherIds = 0;
            let otherLocations = 0;
            for (const [id, list] of Object.entries(this.data['user_locations'])) {
                // Only include IDs with non-empty lists
                if (id !== userId && list.length > 0) {
                    otherIds++;  
                    otherLocations += list.length;
                }
            }
            
            // Build string
            if (otherIds === 0 && otherLocations === 0 && this.data['user_locations'][userId].length > 0) {
                subheading = "Only you've added locations"
            } else if (otherIds > 0 && otherLocations >0) {
                const friendText = otherIds === 1 ? 'friend has' : 'friends have';
                const locationText = otherLocations === 1 ? 'location' : 'locations';
                subheading = `${otherIds} ${friendText} added ${otherLocations} ${locationText}`;
            }
        }
        console.log(`Generated subheading '${subheading}'`);
        return subheading;
    }
}
