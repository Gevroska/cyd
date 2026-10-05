// Filter in native code, before Electron converts uploadData for a callback.
// Unrelated Blob/beacon uploads can reach CloneDataPipeGetter with an empty
// pipe in Electron 44.4.3. X only needs GraphQL metadata and rate-limit headers.
export const X_API_REQUEST_FILTER = {
  urls: [
    "https://x.com/i/api/graphql/*",
    "https://api.x.com/graphql/*",
    "https://twitter.com/i/api/graphql/*",
    "https://api.twitter.com/graphql/*",
  ],
};
