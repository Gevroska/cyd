// Connectivity checks contact only the platform the user is working with.
export function platformConnectivityURL(accountType: string): string | null {
  switch (accountType) {
    case "X":
      return "https://x.com/robots.txt";
    case "Facebook":
      return "https://www.facebook.com/robots.txt";
    case "Bluesky":
      return "https://bsky.social/robots.txt";
    default:
      return null;
  }
}
