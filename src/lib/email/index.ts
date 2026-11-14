import "server-only";
import { Resend } from "resend";
import type { SendEmail } from "./types.ts";

export type { EmailMessage, SendEmail, SendResult } from "./types.ts";

let resend: Resend | undefined;

/** Sends one email through Resend. RESEND_API_KEY is a server secret, set on Vercel and in .envrc. Never throws: the
 * SDK "returns `{ data, error }` instead of throwing" except on network failures (https://resend.com/docs/send-with-nodejs),
 * which are caught here too. Errors are logged by name and status only; their messages can quote addresses. */
export const sendEmail: SendEmail = async ({ idempotencyKey, ...message }) => {
  const key = process.env.RESEND_API_KEY;
  if (!key) { console.error("email: RESEND_API_KEY is not set"); return { ok: false }; }
  resend ??= new Resend(key);
  try {
    // The idempotency key makes a resend of the same message within 24 hours a no-op (Resend send-email API reference:
    // https://resend.com/docs/api-reference/emails/send-email).
    const { error } = await resend.emails.send(message, { idempotencyKey });
    if (error) { console.error(`email: Resend refused (${error.name}, ${error.statusCode ?? "no status"})`); return { ok: false }; }
    return { ok: true };
  } catch (err) {
    console.error(`email: send failed (${(err as Error)?.name ?? "error"})`);
    return { ok: false };
  }
};
