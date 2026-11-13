// Facts only Banister can supply for the privacy policy and the form notices. Each bracketed value is a blank that
// renders highlighted (src/components/Blank.tsx) so it can't pass for real text; fill all of them before launch (#36).
export const LEGAL = {
  entity: "[LEGAL ENTITY NAME]",
  postalAddress: "[POSTAL ADDRESS]",
  privacyEmail: "[PRIVACY EMAIL]",
  /** Years without contact after which a website submission is deleted. [Design Choice, owner 2026-11-13] 4: the
   * shortest that still meets California's 4-year referral-record rule, if it applies (reports/, "Global candidate
   * storage"). */
  cutoffYears: "4",
  effectiveDate: "[EFFECTIVE DATE]",
  /** [Design Choice, owner 2026-11-13] the same clock as candidates. */
  employerRetention: "4 years from our last contact",
  /** [Design Choice, owner 2026-11-13] confirmed as Banister's practice. */
  clientSharing: "We will ask for your agreement before sending your details to a client.",
  /** [Design Choice, owner 2026-11-13] confirmed; the site has no ad or analytics code. */
  noSale: "We do not sell your personal information or share it for cross-context behavioral advertising.",
} as const;

export const isBlank = (value: string) => value.startsWith("[");
