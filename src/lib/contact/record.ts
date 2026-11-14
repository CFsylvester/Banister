// Records a contact-form submission in Ezekia (epic #88; the candidate flow from #14). Pure: takes the client, so it is
// unit-testable with a fake. Every call it makes exists on the client in ../ezekia/client.ts.
//
// - New person, with a résumé: Ezekia creates the person from the CV and parses it, then the form's names, email and
//   phone are set on them, because the form wins over the parse.
// - New person, without a résumé: created from the form's fields.
// - Existing person (exact email match): never re-parsed or renamed. Sending a CV to an update "will replace existing
//   data with that from the CV" (help-centre "API Integration", cited in client.ts), so a résumé is attached as a
//   document instead, and a phone number not already on the record is added.
// - Always: one note holding the message and how to reply.
import type { EzekiaClient, EzekiaPerson } from "../ezekia/client.ts";
import type { ContactFields } from "./fields.ts";
import type { Resume } from "./resume.ts";

/** Ezekia rejects a new person with no company: `POST /v4/people` → 422 "Company is required" (live call, 2026-10-29,
 * src/lib/ezekia/subscribe.ts). Candidates aren't asked for one, and employers may leave it blank. */
export const PLACEHOLDER_COMPANY = "Unknown";

export type RecordOutcome = { personId: number; created: boolean; multipleMatches: boolean };

const digitsOf = (s: string) => s.replace(/\D/g, "");
const sameEmail = (a: string | undefined, b: string) => !!a && a.trim().toLowerCase() === b.trim().toLowerCase();
const hasEmail = (p: EzekiaPerson, email: string) => !!p.emails?.some((e) => sameEmail(e.address, email));
/** A phone already on the record, compared by its last 10 digits so "+1 (555) 123-4567" matches "555.123.4567". */
const hasPhone = (p: EzekiaPerson, phone: string) =>
  !!p.phones?.some((x) => digitsOf(x.number).slice(-10) === digitsOf(phone).slice(-10));

/** The note added to the person. Plain text; Ezekia shows it on their record. */
export function noteText(f: ContactFields, o: { at: Date; resume: "parsed" | "document" | "none"; multipleMatches: boolean }): string {
  const lines = [
    `Submitted via website: ${f.audience === "employer" ? "employer enquiry" : "candidate form"}, ${o.at.toISOString()}`,
    `Preferred contact: ${f.method}${f.phone ? ` (phone ${f.phone})` : ""}`,
  ];
  if (f.audience === "employer") lines.push(`Company: ${f.company || "not given"}`);
  else lines.push(`Résumé: ${o.resume === "parsed" ? "attached, profile built from it" : o.resume === "document" ? "attached as a document (profile not changed)" : "none"}`);
  if (o.multipleMatches) lines.push("Note: more than one person in Ezekia has this email; this was added to the most recently updated one.");
  lines.push("", "Message:", f.message);
  return lines.join("\n");
}

export async function recordSubmission(client: EzekiaClient, f: ContactFields, resume: Resume | null, at = new Date()): Promise<RecordOutcome> {
  // A résumé is only ever a candidate's; parseContact never lets the employer tab carry one, but don't rely on it here.
  const cv = f.audience === "candidate" ? resume : null;
  const matches = await client.findPeopleByEmail(f.email);
  const existing = matches[0]; // most recently updated first
  const multipleMatches = matches.length > 1;

  if (existing) {
    if (cv) await client.addDocument(existing.id, cv.file, cv.filename);
    if (f.phone && !hasPhone(existing, f.phone)) await client.addPhone(existing.id, f.phone);
    await client.addNote([existing.id], noteText(f, { at, resume: cv ? "document" : "none", multipleMatches }));
    return { personId: existing.id, created: false, multipleMatches };
  }

  const companyName = (f.audience === "employer" && f.company) || PLACEHOLDER_COMPANY;
  const person = cv
    ? await client.createPersonFromCv(cv.file, cv.filename)
    : await client.createPerson({ firstName: f.first, lastName: f.last, email: f.email, phone: f.phone || undefined, companyName });
  if (cv) await client.updatePersonNames(person.id, { firstName: f.first, lastName: f.last });
  // createPerson's emails[]/phones[] keys are [unverified] (client.ts), and a parsed CV may hold a different address,
  // so add whatever the returned record lacks. If the create response omits the lists even though they were saved, this
  // could add a second copy [unverified]; the Preview check in quickstart.md §3 settles it (task T018).
  if (!hasEmail(person, f.email)) await client.addEmail(person.id, f.email, true);
  if (f.phone && !hasPhone(person, f.phone)) await client.addPhone(person.id, f.phone, true);
  await client.addNote([person.id], noteText(f, { at, resume: cv ? "parsed" : "none", multipleMatches: false }));
  return { personId: person.id, created: true, multipleMatches: false };
}
