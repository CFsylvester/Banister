// Shared by the sign-up form (client) and its Server Action, so both validate the same way. Pure: no server-only.

/** RFC 5321 caps a forward-path at 256 octets including the angle brackets, so 254 for the address itself
 * (https://www.rfc-editor.org/rfc/rfc5321#section-4.5.3.1.3). Checked BEFORE the regex so oversize input never reaches it. */
export const MAX_EMAIL = 254;

// Domain labels exclude ".", so there is one way to split the domain and matching stays linear. The earlier
// `[^\s@]+\.` let "." match on both sides and took 874ms on a 40k-char dotted string (measured 2026-11-03).
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/;

/** Hidden honeypot field. A name autofill won't recognise, so browsers don't fill it for real people. */
export const HONEYPOT_FIELD = "hp_signup_x";

export const EMAIL_HELP = "Please enter a valid email address, e.g. name@company.com.";

/** Trimmed email if it is valid, else null. */
export function validEmail(raw: string): string | null {
  const v = raw.trim();
  return v.length <= MAX_EMAIL && EMAIL.test(v) ? v : null;
}
