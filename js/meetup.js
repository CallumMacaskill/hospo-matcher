import { reverseGeocodeLocation, searchNearbyPlaces } from './maps.js';

export class Meetup {
    constructor(data) {
        this.setNewState(data)
    }

    setNewState(data) {
        this.data = data;
        this.resultMessage = null;
        this.resultLocation = null;
        this.resultSearchRadius = null;
        this.resultAddress = null;
        this.nearbyPlaces = null;
        console.log('Set new state to meetup')
    }

    flattenCoordinates() {
        let coordinates = [];
        Object.values(this.data['user_locations']).forEach(list => {
            list.forEach(coord => {
                if (coord.latitude && coord.longitude) {
                    coordinates.push({
                        latitude: parseFloat(coord.latitude),
                        longitude: parseFloat(coord.longitude),
                    });
                }
            });
        });
        return coordinates;
    }

    haversineDistance(coord1, coord2) {
        const R = 6371; // Earth's radius in km
        const toRadians = deg => (deg * Math.PI) / 180;

        const dLat = toRadians(coord2.latitude - coord1.latitude);
        const dLon = toRadians(coord2.longitude - coord1.longitude);
        const lat1 = toRadians(coord1.latitude);
        const lat2 = toRadians(coord2.latitude);

        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const result = R * c * 1000;
        console.log(`Calculated Haversine distance: ${result}`)
        return R * c * 1000; // Convert to meters
    }

    calculateMidpoint(coordinates) {
        if (coordinates.length === 0) {
            throw new Error("Invalid inputs for calculating midpoint.");
        }
    
        let totalLatitude = 0;
        let totalLongitude = 0;
    
        // Iterate through the lists and accumulate latitude and longitude values
        coordinates.forEach(coord => {
            totalLatitude += coord.latitude;
            totalLongitude += coord.longitude;
        });
    
        this.resultLocation = {
            latitude: totalLatitude / coordinates.length,
            longitude: totalLongitude / coordinates.length,
        };
        console.log(`Calculated midpoint ${this.resultLocation.latitude}, ${this.resultLocation.longitude}`)
    }

    calculateSearchRadius(coordinates, scalingFactor = 0.35, minRadius = 100, maxRadius = 3000) {
        if (!this.resultLocation) {
            throw new Error("Midpoint must be calculated before computing search radius.");
        }
    
        let distances = [];
    
        // Calculate the distances to the midpoint for each coordinate
        coordinates.forEach(coord => {
            const distance = this.haversineDistance(coord, this.resultLocation);
            distances.push(distance);
        });
    
        // Compute the mean distance
        const totalDistance = distances.reduce((acc, dist) => acc + dist, 0);
        const averageDistance = totalDistance / coordinates.length;
        console.log(`Mean distance: ${averageDistance}`);
    
        // Calculate search radius based on distance
        let searchRadius = scalingFactor * averageDistance;
        console.log(`Scaled distance: ${searchRadius}`);
    
        // Clamp the radius to a reasonable range (in km)
        searchRadius = Math.max(minRadius, Math.min(searchRadius, maxRadius));
        console.log(`Clamped distance: ${searchRadius}`);
    
        return searchRadius;
    }
    

    async evaluateResult(open_sesame) {
        console.log('Evaluating result')    
        // Calculate the number of locations submitted
        const numLocations = Object.values(this.data.user_locations).reduce((sum, list) => sum + list.length, 0);
        const coordinates = this.flattenCoordinates();
    
        if (coordinates.length > 1) {
            // Calculate midpoint coordinates
            this.calculateMidpoint(coordinates);

            // Calculate midpoint nearby location search radius
            const searchRadius = this.calculateSearchRadius(coordinates);
    
            // Update midpoint element text
            this.resultMessage = `Your midpoint between ${numLocations} locations`;
    
            const address = await reverseGeocodeLocation(this.resultLocation);
            this.resultAddress = address
    
            // Search nearby Places
            this.nearbyPlaces = await searchNearbyPlaces(this.resultLocation, searchRadius, open_sesame);
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
