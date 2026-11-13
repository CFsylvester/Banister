// Who may use the candidate form. [Design Choice, owner 2026-11-13] Banister takes candidate submissions from the US
// only, so the site is written to US privacy and record-keeping law alone; outside the US the candidate tab shows a
// notice instead of the form (src/proxy.ts). The employer form and the newsletter stay open everywhere.

/** Vercel's "two-character ISO 3166-1 country code" for the requester's public IP
 * (https://vercel.com/docs/headers/request-headers#x-vercel-ip-country). The docs don't say whether it can be absent,
 * or whether Vercel overwrites a value the client sends [unverified], so this is a best-effort check, not proof. */
export const COUNTRY_HEADER = "x-vercel-ip-country";

/** The US plus its inhabited territories and minor outlying islands, which have their own ISO 3166-1 codes. */
const US_CODES = new Set(["US", "PR", "GU", "VI", "AS", "MP", "UM"]);

/** The visitor's country code, or null when unknown. `override` (GEO_COUNTRY_OVERRIDE) stands in for the header where
 * Vercel doesn't set it, such as `next dev`; it is ignored when the header is present. */
export function requestCountry(headers: Pick<Headers, "get">, override = process.env.GEO_COUNTRY_OVERRIDE): string | null {
  const code = (headers.get(COUNTRY_HEADER) ?? override ?? "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

/** True only for a request located in the US. Unknown counts as outside: the form stays shut unless Vercel says US. */
export function candidateFormOpen(headers: Pick<Headers, "get">, override?: string): boolean {
  const country = requestCountry(headers, override);
  return country !== null && US_CODES.has(country);
}
