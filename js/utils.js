export function generateCrudUrl(path, params = {}) {
    const queryString = Object.entries(params)
        .filter(([_, value]) => value !== null && value !== undefined) // Remove null/undefined values
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join("&");

    const url =  queryString ? `${path}/?${queryString}` : `${path}/`;
    console.log(`Generated URL: ${url}`);
    return url
}
