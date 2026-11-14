// The employer enquiry email (epic #88, Story 2). Pure: takes the sender, so it is unit-testable. The Ezekia record is
// written first by the handler (record.ts) because the database is the record; this email is how the team hears about
// it. [Design Choice, owner 2026-11-13: email + Ezekia record, so the privacy policy's "client database" stays true.]
import { createHash } from "node:crypto";
import type { SendEmail } from "../email/types.ts";
import { oneLine, type ContactFields } from "./fields.ts";

/** Where the enquiry goes and who it is from. Both come from the deployment's env vars (quickstart.md §2). */
export type EmailConfig = { to: string; from: string };

/** The configured addresses, or null when either is missing, so the form shows an error instead of a thank-you. */
export function emailConfig(env: Record<string, string | undefined> = process.env): EmailConfig | null {
  const to = env.CONTACT_TO_EMAIL?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim();
  return to && from ? { to, from } : null;
}

/** Same person + same message → same key, so a retry after a partial failure doesn't email the team twice. Resend keys
 * are at most 256 characters (https://resend.com/docs/send-with-nodejs); a hex SHA-256 is 64. */
export function idempotencyKey(f: ContactFields): string {
  return `contact-${createHash("sha256").update(`${f.email.toLowerCase()}\n${f.message}`).digest("hex")}`;
}

export function employerSubject(f: ContactFields): string {
  return oneLine(`Website enquiry — ${f.company || "no company given"} — ${f.first} ${f.last}`).slice(0, 200);
}

/** Plain text only: no HTML, so nothing a visitor types can become markup in the team's inbox. */
export function employerText(f: ContactFields, at: Date): string {
  return [
    "A new enquiry from the employer form on banisterintus.com.",
    "Reply to this email to answer them directly. It is also recorded in Ezekia with a note.",
    "",
    `Name: ${f.first} ${f.last}`,
    `Company: ${f.company || "not given"}`,
    `Email: ${f.email}`,
    `Phone: ${f.phone || "not given"}`,
    `Preferred contact: ${f.method}`,
    `Sent: ${at.toISOString()}`,
    "",
    "Message:",
    f.message,
  ].join("\n");
}

export async function emailEmployer(send: SendEmail, config: EmailConfig, f: ContactFields, at = new Date()): Promise<boolean> {
  const { ok } = await send({
    from: config.from,
    to: config.to,
    replyTo: f.email,
    subject: employerSubject(f),
    text: employerText(f, at),
    idempotencyKey: idempotencyKey(f),
  });
  return ok;
}
