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

export function calculateMidpoint(session, latitude, longitude) {
    if (!session) {
        throw new Error("Invalid inputs for calculating midpoint.");
    }

    let totalLatitude = 0;
    let totalLongitude = 0;

    if ( latitude ) {
        totalLatitude += latitude;
    }
    if ( longitude ) {
        totalLongitude += longitude;
    }

    Object.values(session.user_coordinates).forEach(({ latitude, longitude }) => {
        totalLatitude += latitude;
        totalLongitude += longitude;
    });

    let numCoordinates = Object.keys(session.user_coordinates).length;
    if (latitude && longitude ) {
        numCoordinates += 1
    }

    return {
        latitude: totalLatitude / numCoordinates,
        longitude: totalLongitude / numCoordinates,
    };
}
