export async function loadGoogleMapsApi(apiKey) {
    (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
        key: apiKey,
        v: "beta",
    });
    await google.maps.importLibrary("places");
    await google.maps.importLibrary("geocoding");
}

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
        console.log(`Performing reverse geocode for location ${location.latitude}, ${location.longitude}`)
        const response = await geocoder.geocode(geocodeArgs);
        if (response.results[0]) {
            const address = response.results[0].formatted_address
            console.log(`Received address ${address}`)
            return address;
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
    console.log(`Searching places near ${location.latitude}, ${location.longitude}`);

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
        const data = await response.json();
        const places = data.places;
        console.log(`Received places: ${places}`)
        return places;
    } catch (error) {
        console.error("Unexpected error:", error);
        return { error_details: error.message };
    }
};
