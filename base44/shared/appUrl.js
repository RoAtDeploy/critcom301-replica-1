// Trusted base URL for links embedded in outbound emails.
//
// Never derive this from a client-supplied request header (e.g. Origin),
// which can be spoofed to craft phishing links. Set the APP_BASE_URL
// environment variable to your production app URL.
export function getAppUrl() {
  const url = (Deno.env.get("APP_BASE_URL") || "https://app.base44.com").trim();
  return url.replace(/\/+$/, "");
}