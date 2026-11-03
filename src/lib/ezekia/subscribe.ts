// Newsletter sign-up → Ezekia list. Pure (takes the client) so it is unit-testable; the Server Action in
// src/app/actions/subscribe.ts supplies the real client and the list id.
import type { EzekiaClient } from "./client.ts";

/**
 * The sign-up form collects an email only, but Ezekia rejects a new person without a first name, last name and company:
 * `POST /v4/people` with just `emails[]` → 422 "First name is required", "Last name is required", "Company is required"
 * (live call, 2026-10-29). So new sign-ups get these placeholders, which are easy to find and tidy in Ezekia.
 */
export const SIGNUP_PLACEHOLDER = { lastName: "Website sign-up", companyName: "Unknown" } as const;

/**
 * Reuses the most recently updated person with this email, or creates one, then adds them to the list.
 * An existing person's record is left alone: a public form must not overwrite CRM data. Adding someone already on
 * the list is a plain PUT, so a repeat sign-up is harmless — except that Ezekia's email search can take several
 * minutes to index a NEW person (live check, 2026-10-29), so a second sign-up inside that window creates a duplicate.
 */
export async function subscribeToList(client: EzekiaClient, listId: number, email: string): Promise<{ personId: number; created: boolean }> {
  const [existing] = await client.findPeopleByEmail(email);
  const person = existing ?? await client.createPerson({
    firstName: email.slice(0, email.lastIndexOf("@")) || email,
    ...SIGNUP_PLACEHOLDER,
    email,
  });
  await client.addPersonToList(listId, person.id);
  return { personId: person.id, created: !existing };
}
