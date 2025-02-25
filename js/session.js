import { getQueryParam } from './utils.js';

export class CurrentUserData {
    constructor() {
        this.sessionCode = getQueryParam("code");
        this.userId = this.getOrCreateUserId();
    }

    getSessionCode() {
        return this.sessionCode;
    }

    setSessionCode(code) {
        this.sessionCode = code;
    }

    getOrCreateUserId() {
        let userId = localStorage.getItem("user_id");
        if (!userId) {
            userId = crypto.randomUUID();
            localStorage.setItem("user_id", userId);
        }
        return userId;
    }
}

export function calculateMidpoint(session, numLocations) {
    if (!session) {
        throw new Error("Invalid inputs for calculating midpoint.");
    }

    let totalLatitude = 0;
    let totalLongitude = 0;

    // Iterate through the lists and accumulate latitude and longitude values
    Object.values(session['user_coordinates']).forEach(list => {
        list.forEach(coord => {
            if (coord.latitude && coord.longitude) {
                totalLatitude += parseFloat(coord.latitude);
                totalLongitude += parseFloat(coord.longitude);
            }
        });
    });

    return {
        latitude: totalLatitude / numLocations,
        longitude: totalLongitude / numLocations,
    };
}
