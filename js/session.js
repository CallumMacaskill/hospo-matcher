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

export function calculateMidpoint(currentLatitude, currentLongitude, session) {
    if (!currentLatitude || !currentLongitude || !session) {
        throw new Error("Invalid inputs for calculating midpoint.");
    }

    let totalLatitude = currentLatitude;
    let totalLongitude = currentLongitude;

    Object.values(session.user_coordinates).forEach(({ latitude, longitude }) => {
        totalLatitude += latitude;
        totalLongitude += longitude;
    });

    const numCoordinates = Object.keys(session.user_coordinates).length;
    return {
        latitude: totalLatitude / (numCoordinates + 1),
        longitude: totalLongitude / (numCoordinates + 1),
    };
}
