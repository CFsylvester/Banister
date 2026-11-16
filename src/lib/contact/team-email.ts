// The email that tells the team about a contact-form submission (epic #88): employer enquiries (Story 2) and candidate
// submissions. Pure: takes the sender, so it is unit-testable. The Ezekia record is written first by the handler
// (record.ts) because the database is the record; this email is how the team hears about it. [Design Choice, owner
// 2026-11-13: email + Ezekia record, so the privacy policy's "client database" stays true. Owner 2026-11-16: candidates
// are emailed too, to the same inbox.]
import { createHash } from "node:crypto";
import type { EmailMessage, SendEmail } from "../email/types.ts";
import { oneLine, type ContactFields } from "./fields.ts";

/** Where the email goes and who it is from. Both come from the deployment's env vars (quickstart.md §2). */
export type EmailConfig = { to: string; from: string };

/** The configured addresses, or null when either is missing, so the form shows an error instead of a thank-you. The
 * Resend key is checked here too: sendEmail can't send without it (src/lib/email/index.ts), and this check runs before
 * the Ezekia write, so a deployment missing it refuses submissions instead of recording ones nobody is told about. */
export function emailConfig(env: Record<string, string | undefined> = process.env): EmailConfig | null {
  const to = env.CONTACT_TO_EMAIL?.trim();
  const from = env.CONTACT_FROM_EMAIL?.trim();
  return to && from && env.RESEND_API_KEY?.trim() ? { to, from } : null;
}

/** A hash of everything sent, so an identical retry after a partial failure doesn't email the team twice, while an edited
 * resubmission (a fixed phone number, say) gets a new key: Resend refuses a reused key with a different payload (its SDK
 * lists an `invalid_idempotent_request` error, node_modules/resend/dist/index.d.mts). Resend keys are at most 256
 * characters (https://resend.com/docs/send-with-nodejs); a hex SHA-256 is 64. */
export function idempotencyKey(m: Omit<EmailMessage, "idempotencyKey">): string {
  return `contact-${createHash("sha256").update(JSON.stringify([m.from, m.to, m.replyTo, m.subject, m.text])).digest("hex")}`;
}

export function teamSubject(f: ContactFields): string {
  const subject = f.audience === "employer"
    ? `Website enquiry — ${f.company || "no company given"} — ${f.first} ${f.last}`
    : `Website candidate — ${f.first} ${f.last}`;
  return oneLine(subject).slice(0, 200);
}

/** Plain text only: no HTML, so nothing a visitor types can become markup in the team's inbox. No timestamp (the email
 * has its own date), so an identical retry hashes to the same idempotency key. */
export function teamText(f: ContactFields, hasResume: boolean): string {
  const employer = f.audience === "employer";
  return [
    `A new ${employer ? "enquiry from the employer" : "submission from the candidate"} form on banisterintus.com.`,
    `Reply to this email to answer them directly. It is also recorded in Ezekia with a note${employer ? "" : " and added to the “Resumes received” list"}.`,
    "",
    `Name: ${f.first} ${f.last}`,
    ...(employer ? [`Company: ${f.company || "not given"}`] : []),
    `Email: ${f.email}`,
    `Phone: ${f.phone || "not given"}`,
    `Preferred contact: ${f.method}`,
    ...(employer ? [] : [`Résumé: ${hasResume ? "attached to their Ezekia record" : "none"}`]),
    "",
    "Message:",
    f.message,
  ].join("\n");
}

export async function emailTeam(send: SendEmail, config: EmailConfig, f: ContactFields, hasResume = false): Promise<boolean> {
  const message = {
    from: config.from,
    to: config.to,
    replyTo: f.email,
    subject: teamSubject(f),
    text: teamText(f, f.audience === "candidate" && hasResume),
  };
  const { ok } = await send({ ...message, idempotencyKey: idempotencyKey(message) });
  return ok;
}
