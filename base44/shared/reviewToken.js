// Shared helpers for signing and verifying staff review links.
//
// A staff review token is an HMAC-SHA256 of the report id under a server-side
// secret (STAFF_REVIEW_SECRET). It is minted when a report is sent to a staff
// member and verified on every public staffReviewReport request, so that
// simply knowing a report id is never enough to read or modify a report.

const enc = new TextEncoder();

async function hmacHex(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret || ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg || ""));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function mintReviewToken(reportId) {
  return hmacHex(Deno.env.get("STAFF_REVIEW_SECRET"), reportId);
}

export function timingSafeEqual(a, b) {
  const sa = String(a || "");
  const sb = String(b || "");
  if (sa.length !== sb.length) return false;
  let diff = 0;
  for (let i = 0; i < sa.length; i++) diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  return diff === 0;
}

export async function verifyReviewToken(reportId, token) {
  const secret = Deno.env.get("STAFF_REVIEW_SECRET");
  if (!secret || !token) return false;
  const expected = await hmacHex(secret, reportId);
  return timingSafeEqual(expected, token);
}