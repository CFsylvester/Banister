"use server";
import { ezekia, EzekiaError } from "@/lib/ezekia";
import { subscribeToList } from "@/lib/ezekia/subscribe";
import { EMAIL_HELP, HONEYPOT_FIELD, validEmail } from "@/lib/signup";

/** Ezekia list "Website Sign Up - Whitepaper" (https://ezekia.com/#/lists/1003445/info). */
const SIGNUP_LIST_ID = 1003445;

export type SubscribeResult = { ok: true } | { ok: false; error: string };

/** The yellow sign-up band (SubscribeBand) calls this. Validation is repeated here: the client's can be skipped. */
export async function subscribe(form: FormData): Promise<SubscribeResult> {
  // Honeypot: bots that fill the hidden field get a fake success and no CRM record. Logged (no email) so false
  // positives from real people would show up.
  if (String(form.get(HONEYPOT_FIELD) ?? "")) { console.info("subscribe: honeypot hit"); return { ok: true }; }

  const email = validEmail(String(form.get("email") ?? ""));
  if (!email) return { ok: false, error: EMAIL_HELP };

  try {
    await subscribeToList(ezekia(), SIGNUP_LIST_ID, email);
    return { ok: true };
  } catch (err) {
    // EzekiaError messages hold method + route + status only (see errors.ts), so they are safe to log; for anything
    // else log just the error's name, never its message, which could quote the email.
    console.error(`subscribe: ${err instanceof EzekiaError ? err.message : `unexpected ${(err as Error)?.name ?? "error"}`}`);
    return { ok: false, error: "Sorry, we couldn’t sign you up just now. Please try again later." };
  }
}
