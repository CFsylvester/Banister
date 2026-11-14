// What the contact Server Action does (epic #88), with its request, Ezekia and email access passed in. Separate from
// src/app/actions/contact.ts because that file imports server-only and can't load under `node --test`.
//
// Order: honeypot → bot check → fields → (candidate) US location → résumé → rate limit → (employer) email config →
// Ezekia record → (employer) email. Every refusal happens before anything is written, and the visitor sees success
// only when every write succeeded (FR-1).
import { EzekiaError } from "../ezekia/errors.ts";
import type { EmailConfig } from "./employer.ts";
import { CONTACT_HONEYPOT, GENERIC_ERROR, parseContact, type ContactFields, type FieldName } from "./fields.ts";
import { checkResume, type Resume } from "./resume.ts";

export { CONTACT_HONEYPOT };

export type ContactResult = { ok: true } | { ok: false; error: string; field?: FieldName | "resume" };

export const CONTACT_ERROR = {
  generic: GENERIC_ERROR,
  bot: "Sorry, we couldn’t send that from this browser. Please try again, or email us.",
  notUs: "We currently accept candidate submissions from the United States only. The employer form is open wherever you are.",
  ip: "Too many attempts. Please try again in about 10 minutes.",
  instance: "We’re getting a lot of messages right now. Please try again in a minute.",
} as const;

export type ContactDeps = {
  /** Read lazily, so refused requests don't touch the request headers. */
  ipKey: () => Promise<string>;
  /** The shared rate limiter (createSignupGuard's shape): why a request is refused, or null to let it through. */
  guard: (ipKey: string) => "ip" | "instance" | null;
  isBot: () => Promise<boolean>;
  inUs: () => Promise<boolean>;
  record: (fields: ContactFields, resume: Resume | null) => Promise<unknown>;
  emailConfig: () => EmailConfig | null;
  emailEmployer: (config: EmailConfig, fields: ContactFields) => Promise<boolean>;
};

/** CONTACT_DRY_RUN=1 is for local runs only (the pixel gates' contact-sending / contact-sent states). It fails closed: it
 * needs the flag AND a request addressed to localhost, so a stray env var on any deployment can't fake a send. */
export function dryRunAllowed(flag: string | undefined, host: string | null): boolean {
  return flag === "1" && /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host ?? "");
}

// Logs carry the step and outcome only: never a name, email, phone, message or file (FR-11).
const log = (msg: string) => console.info(`contact: ${msg}`);

export async function handleContact(form: FormData, d: ContactDeps): Promise<ContactResult> {
  // Bots that fill the hidden field get a fake success and no record, like the sign-up band. Real people never see it.
  if (String(form.get(CONTACT_HONEYPOT) ?? "")) { log("honeypot hit"); return { ok: true }; }
  // A BotID verdict is not certain, so a flagged request gets an error rather than a fake success: a real person
  // wrongly flagged must not believe their message was sent (FR-1).
  if (await d.isBot()) { log("bot check refused"); return { ok: false, error: CONTACT_ERROR.bot }; }

  const parsed = parseContact(form);
  if (!parsed.ok) return { ok: false, error: parsed.error, field: parsed.field };
  const f = parsed.fields;

  let resume: Resume | null = null;
  if (f.audience === "candidate") {
    // Repeated here, not only in src/proxy.ts: proxy.md warns a matcher change can drop its coverage of an action.
    if (!(await d.inUs())) { log("candidate outside US refused"); return { ok: false, error: CONTACT_ERROR.notUs }; }
    const r = await checkResume(form.get("resume"));
    if (!r.ok) return { ok: false, error: r.error, field: "resume" };
    resume = r.resume;
  }

  // Counted after validation, so typos don't use up anyone's limit; only requests that will reach Ezekia count.
  const refused = d.guard(await d.ipKey());
  if (refused) { console.warn(`contact: rate limited (${refused})`); return { ok: false, error: CONTACT_ERROR[refused] }; }

  // Checked before the Ezekia write, so a misconfigured deployment doesn't record enquiries nobody is told about.
  const config = f.audience === "employer" ? d.emailConfig() : null;
  if (f.audience === "employer" && !config) { console.error("contact: email not configured (CONTACT_TO_EMAIL / CONTACT_FROM_EMAIL)"); return { ok: false, error: CONTACT_ERROR.generic }; }

  const started = Date.now();
  try {
    await d.record(f, resume);
  } catch (err) {
    // EzekiaError messages hold method + route + status only (errors.ts), so they are safe to log.
    console.error(`contact: ${f.audience} record failed: ${err instanceof EzekiaError ? err.message : `unexpected ${(err as Error)?.name ?? "error"}`}`);
    return { ok: false, error: CONTACT_ERROR.generic };
  }

  if (config && !(await d.emailEmployer(config, f))) {
    log(`employer recorded, email failed (${Date.now() - started}ms)`);
    return { ok: false, error: CONTACT_ERROR.generic };
  }
  log(`${f.audience} sent${resume ? " with résumé" : ""} (${Date.now() - started}ms)`);
  return { ok: true };
}
