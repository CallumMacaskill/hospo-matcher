export async function reverseGeocodeLocation(location) {
    if (!google || !google.maps || !google.maps.Geocoder) {
        console.error("Google Maps API not loaded");
        return;
    }

    const geocoder = new google.maps.Geocoder();
    var geocodeArgs = {};

    if ("place_id" in location) {
        geocodeArgs.placeId = location["place_id"];
    } else if ("latitude" in location && "longitude" in location) {
        geocodeArgs.location = { lat: location["latitude"], lng: location["longitude"] };
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

export async function searchNearbyPlaces(location, open_sesame) {
    console.log(`Searching places near: ${location.latitude}, ${location.longitude}`);

    const apiUrl = "https://places.googleapis.com/v1/places:searchNearby";
    const requestBody = {
        includedTypes: ["cafe", "bakery", "restaurant"],
        maxResultCount: 5,
        locationRestriction: {
            circle: {
                center: { latitude: location.latitude, longitude: location.longitude },
                radius: 2000.0
            }
        }
    };

    const headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": open_sesame,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress"
    };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error: ${response.status} - ${errorText}`);
            return { error: `API request failed with status ${response.status}`, details: errorText };
        }

        return await response.json();
    } catch (error) {
        console.error("Unexpected error:", error);
        return { error_details: error.message };
    }
};
