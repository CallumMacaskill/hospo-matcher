import { reverseGeocodeLocation, searchNearbyPlaces } from './maps_platform.js';

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
        Object.values(this.data['user_coordinates']).forEach(list => {
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
        let resultMessage = "Only one location submitted. Add more or invite friends to find your midpoint."
    
        // Calculate the number of locations submitted
        const numLocations = Object.values(this.data.user_coordinates).reduce((sum, list) => sum + list.length, 0);
    
        if (numLocations > 1) {
            // Calculate midpoint coordinates
            this.calculateMidpoint(numLocations);
    
            // Update midpoint element text
            resultMessage = `Your midpoint between ${numLocations} locations`;
    
            const address = await reverseGeocodeLocation(this.resultLocation);
            this.resultAddress = address
    
            // Search nearby Places
            this.nearbyPlaces = await searchNearbyPlaces(this.resultLocation, open_sesame);
        }

        this.resultMessage = resultMessage;
    }

    evaluatePageSubheading(code, userId) {
        // Generate contextualised page description
        var page_description = 'Start a new meetup by adding your location'
        if (code) {
            const code_substring = code.substring(0, 6);
    
            // Check if user has already submitted location
            const userLocations = this.data['user_coordinates'][userId];
            if (userLocations && userLocations.length > 0) {
                page_description = `You've joined meetup #${code_substring}`;
            } else {
                page_description = `You're joining meetup #${code_substring}`;
            }
        }
        console.log(`Evaluated page description: ${page_description}`)
        return page_description;
    }
}
