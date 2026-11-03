// What the sign-up Server Action does, with its request and Ezekia access passed in. Separate from
// src/app/actions/subscribe.ts because that file imports server-only and can't load under `node --test`.
import { EzekiaError } from "./ezekia/errors.ts";
import { createRateLimiter } from "./rate-limit.ts";
import { EMAIL_HELP, HONEYPOT_FIELD, validEmail } from "./signup.ts";

export type SubscribeResult = { ok: true } | { ok: false; error: string };

export const RATE_LIMITED = {
  ip: "Too many sign-up attempts. Please try again in about 10 minutes.",
  instance: "We’re getting a lot of sign-ups right now. Please try again in a minute.",
};

// Limits [Design Choice]. Sign-ups are one per person per newsletter, so 5 from one address is generous (an office
// behind one IP still fits). Each sign-up costs 2-3 Ezekia calls against the 5 req/s shared with CV uploads (Ezekia
// support, see src/lib/ezekia/client.ts): 1 a second keeps one instance's peak under that, and 20 a minute keeps its
// average near 1 req/s. 429 retries or several instances can still exceed it. Trade-off: a few addresses can use up the
// shared caps, delaying real sign-ups by up to a minute, which is the price of protecting Ezekia.
const PER_IP = { limit: 5, windowMs: 10 * 60_000 };
const PER_SECOND = { limit: 1, windowMs: 1_000 };
const PER_MINUTE = { limit: 20, windowMs: 60_000 };

/** Why a request is refused, or null to let it through and count it. A refused request counts against nothing, so a
 * noisy address can't use up the shared caps, and a shared-cap refusal doesn't use up a visitor's own limit. */
export function createSignupGuard(now?: () => number) {
  const perIp = createRateLimiter({ ...PER_IP, now });
  const perSecond = createRateLimiter({ ...PER_SECOND, now });
  const perMinute = createRateLimiter({ ...PER_MINUTE, now });
  return (ipKey: string): keyof typeof RATE_LIMITED | null => {
    if (perIp.full(ipKey)) return "ip";
    if (perSecond.full("all") || perMinute.full("all")) return "instance";
    perIp.hit(ipKey); perSecond.hit("all"); perMinute.hit("all");
    return null;
  };
}

export type SubscribeDeps = {
  /** Reads the rate-limit key lazily, so requests that never reach the guard don't touch the request headers. */
  ipKey: () => Promise<string>;
  guard: (ipKey: string) => keyof typeof RATE_LIMITED | null;
  addToList: (email: string) => Promise<unknown>;
};

export async function handleSubscribe(form: FormData, { ipKey, guard, addToList }: SubscribeDeps): Promise<SubscribeResult> {
  // Honeypot: bots that fill the hidden field get a fake success and no CRM record. Logged (no email) so false
  // positives from real people would show up.
  if (String(form.get(HONEYPOT_FIELD) ?? "")) { console.info("subscribe: honeypot hit"); return { ok: true }; }

  const email = validEmail(String(form.get("email") ?? ""));
  if (!email) return { ok: false, error: EMAIL_HELP };

  // After validation: only requests that would spend Ezekia calls are counted, so typos don't lock anyone out.
  // Logged (no IP or email) so the limits can be tuned and a sustained attack shows up.
  const refused = guard(await ipKey());
  if (refused) { console.warn(`subscribe: rate limited (${refused})`); return { ok: false, error: RATE_LIMITED[refused] }; }

  try {
    await addToList(email);
    return { ok: true };
  } catch (err) {
    // EzekiaError messages hold method + route + status only (see errors.ts), so they are safe to log; for anything
    // else log just the error's name, never its message, which could quote the email.
    console.error(`subscribe: ${err instanceof EzekiaError ? err.message : `unexpected ${(err as Error)?.name ?? "error"}`}`);
    return { ok: false, error: "Sorry, we couldn’t sign you up just now. Please try again later." };
  }
}
