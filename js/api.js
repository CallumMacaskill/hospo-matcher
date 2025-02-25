import { fetchData } from './utils.js';

export async function getSession(sessionCode) {
    const url = `/.netlify/functions/read_session?code=${sessionCode}`;
    return fetchData(url);
}

export async function createSession(userId, latitude, longitude, placeId) {
    var url = `/.netlify/functions/create_session?userId=${userId}&latitude=${latitude}&longitude=${longitude}`;
    if ( placeId ) {
        url = url.concat(`&placeId=${placeId}`);
        console.log(`Made new url ${url}`)
    }
    return fetchData(url);
}

export async function addSessionLocation(sessionCode, userId, latitude, longitude, placeId) {
    var url = `/.netlify/functions/add_session_location?code=${sessionCode}&userId=${userId}&latitude=${latitude}&longitude=${longitude}`;
    if ( placeId ) {
        url = url.concat(`&placeId=${placeId}`);
    }
    return fetchData(url);
}

export async function deleteSessionLocation(sessionCode, userId, latitude, longitude, placeId) {
    var url = `/.netlify/functions/delete_session_location?code=${sessionCode}&userId=${userId}&latitude=${latitude}&longitude=${longitude}`;
    if ( placeId ) {
        url = url.concat(`&placeId=${placeId}`);
    }
    return fetchData(url);
}

export async function getMapsPlatformValue() {
    const url = `/.netlify/functions/read_maps_platform_value`;
    return fetchData(url);
}

export async function loadGoogleMapsApi(apiKey) {
    (g => { var h, a, k, p = "The Google Maps JavaScript API", c = "google", l = "importLibrary", q = "__ib__", m = document, b = window; b = b[c] || (b[c] = {}); var d = b.maps || (b.maps = {}), r = new Set, e = new URLSearchParams, u = () => h || (h = new Promise(async (f, n) => { await (a = m.createElement("script")); e.set("libraries", [...r] + ""); for (k in g) e.set(k.replace(/[A-Z]/g, t => "_" + t[0].toLowerCase()), g[k]); e.set("callback", c + ".maps." + q); a.src = `https://maps.${c}apis.com/maps/api/js?` + e; d[q] = f; a.onerror = () => h = n(Error(p + " could not load.")); a.nonce = m.querySelector("script[nonce]")?.nonce || ""; m.head.append(a) })); d[l] ? console.warn(p + " only loads once. Ignoring:", g) : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)) })({
        key: apiKey,
        v: "beta",
    });
    await google.maps.importLibrary("places");
    await google.maps.importLibrary("geocoding");
}