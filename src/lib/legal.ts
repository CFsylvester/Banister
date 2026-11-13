// Facts only Banister can supply for the privacy policy and the form notices. Each bracketed value is a blank that
// renders highlighted (src/components/Blank.tsx) so it can't pass for real text; fill all of them before launch (#36).
export const LEGAL = {
  entity: "[LEGAL ENTITY NAME]",
  postalAddress: "[POSTAL ADDRESS]",
  privacyEmail: "[PRIVACY EMAIL]",
  /** Years without contact after which a website submission is deleted. [Design Choice, owner 2026-11-13] 4 or 5. */
  cutoffYears: "[4 or 5]",
  effectiveDate: "[EFFECTIVE DATE]",
  employerRetention: "[PERIOD]",
  clientSharing: "[CONFIRM: We will ask for your agreement before sending your details to a client.]",
  noSale: "[CONFIRM: We do not sell your personal information or share it for cross-context behavioral advertising.]",
} as const;

export const isBlank = (value: string) => value.startsWith("[");
