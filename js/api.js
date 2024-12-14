import { fetchData } from './utils.js';

export async function getSession(sessionCode) {
    const url = `/.netlify/functions/read_session?code=${sessionCode}`;
    return fetchData(url);
}

export async function createSession(userId, latitude, longitude) {
    const url = `/.netlify/functions/create_session?userId=${userId}&latitude=${latitude}&longitude=${longitude}`;
    return fetchData(url);
}

export async function updateSession(sessionCode, userId, latitude, longitude) {
    const url = `/.netlify/functions/update_session?code=${sessionCode}&userId=${userId}&latitude=${latitude}&longitude=${longitude}`;
    return fetchData(url);
}
