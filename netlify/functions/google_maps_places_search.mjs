export const handler = async (event) => {
    try {
        // Parse query parameters
        const { latitude, longitude } = event.queryStringParameters;
        console.log(`Received midpoint: ${latitude}, ${longitude}`);

        // Set up API request details
        const apiUrl = "https://places.googleapis.com/v1/places:searchNearby";
        const requestBody = {
            includedTypes: ["cafe", "bakery", "restaurant"],
            maxResultCount: 5,
            locationRestriction: {
                circle: {
                    center: {
                        latitude: latitude,
                        longitude: longitude
                    },
                    radius: 2000.0
                }
            }
        };

        const headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.GOOGLE_MAPS_PLACES_API_KEY,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress"
        };

        // Make the API request
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        console.log(response)
        const data = await response.json();
        console.log("Nearby Places:", data);

        // Return the successful response
        return {
            statusCode: 200,
            body: JSON.stringify({
                places: data.places
            })
        };

    } catch (error) {
        console.error("Error fetching nearby places:", error);

        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};
