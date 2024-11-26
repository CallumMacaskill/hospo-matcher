// Global variables to store latitude and longitude
var currentLatitude = null;
var currentLongitude = null;
var session = null;

// Function to get query parameter value
function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

const sessionCode = getQueryParam("sessionCode");

// If session code present, get session data
if (sessionCode) {
    getSession(sessionCode).then(session_result => {
        console.log(`session:`, session_result);
        session = session_result
        document.getElementById("session-data").innerText = JSON.stringify(session_result);
    });
}

async function getSession(sessionCode) {
    console.log("Fetching session data")
    const url = `/.netlify/functions/read_session?session_code=${sessionCode}`;
    console.log("Fetching from URL:", url);

    const response = await fetch(url);
    console.log("Got response")
    data = await response.json();
    console.log("Returning data")
    return data
}

// Function to get the user's geolocation
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLatitude = position.coords.latitude;
                currentLongitude = position.coords.longitude;
                console.log(`Latitude: ${currentLatitude}, Longitude: ${currentLongitude}`);
                document.getElementById("coordinates").innerText = `${currentLatitude}, ${currentLongitude}`;
            },
            (error) => {
                console.error(`Error: ${error.message}`);
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

function calculateMidpoint() {

}

// Attach event listeners when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const getLocationBtn = document.getElementById("get-location-btn");
    const createSessionBtn = document.getElementById("create-session-btn");
    const createSessionOutput = document.getElementById("create-session-output");
    const updateSessionBtn = document.getElementById("update-session-btn");
    const updateSessionOutput = document.getElementById("update-session-output");

    // Attach click event listener to "Get Location" button
    getLocationBtn.addEventListener("click", getLocation);

    // Attach click event listener to "Create Session" button
    createSessionBtn.addEventListener("click", async () => {
        if (currentLatitude === null || currentLongitude === null) {
            alert("Please get your location first!");
            return;
        }

        // Dynamically include the lat and long in the fetch URL
        const url = `/.netlify/functions/create_session?latitude=${currentLatitude}&longitude=${currentLongitude}`;
        console.log("Fetching from URL:", url);

        const response = await fetch(url)
            .then((response) => response.json())
            .catch((error) => {
                console.error("Error fetching data:", error);
                return { error: "Failed to fetch data" };
            });

        createSessionOutput.innerText = JSON.stringify(response);
    });

    // Attach click event listener to "Create Session" button
    updateSessionBtn.addEventListener("click", async () => {
        if (currentLatitude === null || currentLongitude === null) {
            alert("Please get your location first!");
            return;
        }

        // Dynamically include the lat and long in the fetch URL
        const url = `/.netlify/functions/update_session?code=${sessionCode}&latitude=${currentLatitude}&longitude=${currentLongitude}`;
        console.log("Fetching from URL:", url);

        const response = await fetch(url)
            .then((response) => response.json())
            .catch((error) => {
                console.error("Error fetching data:", error);
                return { error: "Failed to fetch data" };
            });

        createSessionOutput.innerText = JSON.stringify(response);
    });
});
