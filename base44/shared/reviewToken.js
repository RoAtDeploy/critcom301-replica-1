// Per-report review tokens (capability URLs).
//
// A random token is minted when a report is sent to a staff member, stored on
// the report, and embedded in the staff-review link. The public
// staffReviewReport endpoint verifies the provided token against the stored
// value, so knowing a report id alone is never enough to read or modify a
// report. No server-side secret is required.

export function mintReviewToken() {
  return crypto.randomUUID();
}

export function timingSafeEqual(a, b) {
  const sa = String(a || "");
  const sb = String(b || "");
  if (sa.length !== sb.length) return false;
  let diff = 0;
  for (let i = 0; i < sa.length; i++) diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  return diff === 0;
}

export function verifyReviewToken(storedToken, providedToken) {
  if (!storedToken || !providedToken) return false;
  return timingSafeEqual(storedToken, providedToken);
}