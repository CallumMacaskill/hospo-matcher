export const handler = async (event) => {
    try {
        return {
            statusCode: 200,
            body: JSON.stringify({
                maps_open_sesame: process.env.GOOGLE_MAPS_PLACES_API_KEY,
                ip_open_sesame: process.env.IPINFO_TOKEN,
            })
        };
    } catch (error) {
        console.error("Error fetching API value:", error);

        // Return an error response
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};
