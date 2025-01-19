export function getLocation() {
    return new Promise((resolve, reject) => {
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
}

export async function reverseGeocodeAddress(latitude, longitude, placeId) {
    if (!google || !google.maps || !google.maps.Geocoder) {
        console.error("Google Maps API not loaded");
        return;
    }

    const geocoder = new google.maps.Geocoder();
    var geocodeArgs = {};

    if (placeId) {
        geocodeArgs.placeId = placeId;
    } else if (latitude && longitude) {
        geocodeArgs.location = { lat: latitude, lng: longitude };
    }

    try {
        // Await the geocoder response
        const response = await geocoder.geocode(geocodeArgs);
        if (response.results[0]) {
            return response.results[0].formatted_address; // Return the address
        } else {
            console.warn("No reverse geocode results found");
            return null;
        }
    } catch (error) {
        console.error("Geocoder failed due to:", error);
        throw error; // Re-throw the error to handle it in the calling code
    }
}

