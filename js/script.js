// Function to get query parameter value
function getQueryParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

var sessionCode = getQueryParam("sessionCode");
var session = null;

// If session code present, get session data
if (sessionCode) {
    getSession(sessionCode).then(session_result => {
        console.log(`session:`, session_result);
        session = session_result
    });
}

async function getSession(sessionCode) {
    console.log("Fetching session data")
    const url = `/.netlify/functions/read_session?session_code=${sessionCode}`;
    console.log("Fetching from URL:", url);

    const response = await fetch(url);
    console.log("Got response")
    const data = await response.json();
    console.log("Returning data")
    return data
}

function shareLink() {
    // Require active session
    if (!sessionCode) {
        console.log("session invalid")
        return
    }

    // Construct link
    const url = `http://localhost:8888/?sessionCode=${sessionCode}`

    // Copy to clipboard
    navigator.clipboard.writeText(url);
    console.log(`Copied to clipboard: ${url}`)
}

function getLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const currentLatitude = position.coords.latitude;
                    const currentLongitude = position.coords.longitude;
                    console.log(`Latitude: ${currentLatitude}, Longitude: ${currentLongitude}`);
                    resolve({ currentLatitude, currentLongitude });
                },
                (error) => {
                    console.error(`Error: ${error.message}`);
                    reject(error);
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
            reject(new Error("Geolocation not supported"));
        }
    });
}


function calculateMidpoint(currentLatitude, currentLongitude) {
    // Check if inputs are valid
    if (!currentLatitude || !currentLongitude || !sessionCode || !session) {
        console.error("Invalid inputs: currentLatitude, currentLongitude, and session must have values.");
        return null;
    }
    console.log("args valid")

    // Parse the coordinates from the session
    var coordinates = session.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
        console.error("Invalid session format: session.coordinates must be a non-empty array.");
        return null;
    }
    console.log("coordinates valid")

    // Accumulate coordinate values
    let totalLatitude = currentLatitude;
    let totalLongitude = currentLongitude;
    coordinates.forEach(coord => {
        totalLatitude += coord.latitude;
        totalLongitude += coord.longitude;
    });
    console.log(`Total lat: ${totalLatitude}, total long: ${totalLongitude}`)

    // Calculate the average latitude and longitude
    const midpoint = {
        latitude: totalLatitude / (coordinates.length + 1),
        longitude: totalLongitude / (coordinates.length + 1)
    };

    console.log(`Midpoint: ${midpoint.latitude}, ${midpoint.longitude}`)

    return midpoint;
}

// Function to display places in the HTML
function displayPlaces(data) {
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = ''; // Clear the current list
    
    data.places.forEach(place => {
        const placeDiv = document.createElement('div');
        placeDiv.classList.add('place');

        const title = document.createElement('h3');
        title.textContent = place.displayName.text;
        placeDiv.appendChild(title);

        const address = document.createElement('p');
        address.textContent = place.formattedAddress;
        placeDiv.appendChild(address);

        placesList.appendChild(placeDiv);
    });
}

async function sessionLocationHandling() {
    // Await the result of getLocation
    const { currentLatitude, currentLongitude } = await getLocation();

    if (!sessionCode) {
        console.log("Null session!");
        if (currentLatitude === null || currentLongitude === null) {
            alert("Variable error!");
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
        session = response.session
        sessionCode = session.code
    } else if (sessionCode) {
        console.log("Session :)")

        // Update session with new user's coordinates
        var url = `/.netlify/functions/update_session?code=${sessionCode}&latitude=${currentLatitude}&longitude=${currentLongitude}`;
        console.log("Fetching from URL:", url);

        var response = await fetch(url)
            .then((response) => response.json())
            .catch((error) => {
                console.error("Error fetching data:", error);
                return { error: "Failed to fetch data" };
            });

        // Calculate midpoint
        const midpoint = calculateMidpoint(currentLatitude, currentLongitude);
        console.log(`Got midpoint: ${midpoint.latitude}, ${midpoint.longitude}`)

        // Find nearby results
        console.log("Searching nearby places")
        url = `/.netlify/functions/google_maps_places_search?latitude=${midpoint.latitude}&longitude=${midpoint.longitude}`;

        response = await fetch(url);
        console.log("Got places")
        const data = await response.json();

        displayPlaces(data)
    }
}


// Attach event listeners when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {
    const getLocationBtn = document.getElementById("get-location-btn");
    const shareLinkBtn = document.getElementById("share-link-btn");

    // Attach click event listener to buttons
    getLocationBtn.addEventListener("click", sessionLocationHandling);
    shareLinkBtn.addEventListener("click", shareLink)
});
