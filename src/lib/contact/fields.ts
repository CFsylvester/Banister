// Contact form fields (src/components/ContactForm.tsx) parsed and validated per tab. Pure, no server-only, so the
// Server Action and `node --test` share it. Validation is repeated on the server because the browser's can be skipped.
import { MAX_EMAIL, validEmail } from "../signup.ts";

export type Audience = "candidate" | "employer";
export type ContactMethod = "Email" | "Phone";

export type ContactFields = {
  audience: Audience;
  first: string;
  last: string;
  email: string;
  phone: string; // "" when not given
  method: ContactMethod;
  message: string;
  company: string; // employer only; "" for candidates
};

export type FieldName = "first" | "last" | "email" | "phone" | "message" | "company" | "usCandidate";
export type ParseResult = { ok: true; fields: ContactFields } | { ok: false; field: FieldName; error: string };

// Caps [Design Choice]: generous for real input, small enough that a note or email stays readable and a flood of
// oversized fields can't reach Ezekia. Email uses the RFC 5321 cap from signup.ts.
export const MAX = { name: 100, phone: 40, company: 200, message: 5000 } as const;

/** Hidden field that tells the server which tab was submitted. */
export const AUDIENCE_FIELD = "audience";

/** Hidden honeypot field on the contact form. Different from the sign-up band's, which is on the same page. */
export const CONTACT_HONEYPOT = "hp_contact_x";

/** Shown when a send fails for any reason the visitor can't fix. Here, not in handler.ts, so the form can import it. */
export const GENERIC_ERROR = "Sorry, we couldn’t send that just now. Your details are still here, so please try again in a moment, or email us.";

// C0/C1 control characters except tab and newline (kept in the message). Stripped so a field can't forge extra
// lines in an email subject or note header.
const CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;
const LINE_BREAKS = /[\r\n\t]+/g;

/** One-line text: control characters and line breaks removed, whitespace collapsed, trimmed. */
export function oneLine(raw: string): string {
  return raw.replace(CONTROL, "").replace(LINE_BREAKS, " ").replace(/\s+/g, " ").trim();
}

const text = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

// A phone number: digits with the usual separators, and at least 7 digits (the shortest US local number).
const PHONE = /^\+?[\d\s().\-/]+(\s*(x|ext\.?)\s*\d{1,6})?$/i;
const digits = (s: string) => s.replace(/\D/g, "").length;

export const FIELD_HELP: Record<FieldName, string> = {
  first: "Please enter your first name.",
  last: "Please enter your last name.",
  email: "Please enter a valid email address, e.g. name@company.com.",
  phone: "Please enter a phone number we can reach you on.",
  message: "Please add a short message.",
  company: "Please keep the company name under 200 characters.",
  usCandidate: "Please confirm you live in the United States.",
};

export function parseContact(form: FormData): ParseResult {
  const audience: Audience = text(form, AUDIENCE_FIELD) === "employer" ? "employer" : "candidate";
  const fail = (field: FieldName): ParseResult => ({ ok: false, field, error: FIELD_HELP[field] });

  const first = oneLine(text(form, "first"));
  if (!first || first.length > MAX.name) return fail("first");
  const last = oneLine(text(form, "last"));
  if (!last || last.length > MAX.name) return fail("last");

  const rawEmail = text(form, "email");
  const email = rawEmail.length <= MAX_EMAIL ? validEmail(rawEmail) : null;
  // The address becomes the employer email's reply-to, where a comma or semicolon would make a list and quotes or angle
  // brackets a display name. validEmail (shared with the sign-up band) allows them, so refuse them here.
  if (!email || /[,;<>"]/.test(email)) return fail("email");

  const method: ContactMethod = text(form, "method") === "Phone" ? "Phone" : "Email";
  const phone = oneLine(text(form, "phone"));
  if (phone && (phone.length > MAX.phone || !PHONE.test(phone) || digits(phone) < 7)) return fail("phone");
  if (method === "Phone" && !phone) return fail("phone");

  const message = text(form, "message").replace(CONTROL, "").trim();
  if (!message || message.length > MAX.message) return fail("message");

  // Each tab reads only its own fields, so a forged `company` on the candidate tab or `resume`/`usCandidate` on the
  // employer tab is ignored rather than recorded.
  let company = "";
  if (audience === "employer") {
    company = oneLine(text(form, "company"));
    if (company.length > MAX.company) return fail("company");
  } else if (text(form, "usCandidate") !== "on") {
    return fail("usCandidate");
  }

  return { ok: true, fields: { audience, first, last, email, phone, method, message, company } };
}
