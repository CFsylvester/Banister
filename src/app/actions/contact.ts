"use server";
import { checkBotId } from "botid/server";
import { headers } from "next/headers";
import { emailConfig, emailEmployer } from "@/lib/contact/employer";
import { handleContact, type ContactResult } from "@/lib/contact/handler";
import { recordSubmission } from "@/lib/contact/record";
import { sendEmail } from "@/lib/email";
import { ezekia } from "@/lib/ezekia";
import { candidateFormOpen } from "@/lib/geo";
import { clientIpKey } from "@/lib/rate-limit";
import { createSignupGuard } from "@/lib/subscribe-handler";

// Its own counters, separate from the sign-up band's, with the same limits and reasoning (subscribe-handler.ts): both
// spend calls from Ezekia's 5 req/s budget.
const guard = createSignupGuard();

/** CONTACT_DRY_RUN=1 is for local runs only (the pixel gates' contact-sending / contact-sent states): everything is
 * validated, then nothing is written and the reply comes after the design's 1.2 s send. Never set it on Vercel; it is
 * ignored when VERCEL_ENV is "production" (Vercel system env vars:
 * https://vercel.com/docs/environment-variables/system-environment-variables [unverified that Preview builds set it]). */
const dryRun = process.env.CONTACT_DRY_RUN === "1" && process.env.VERCEL_ENV !== "production";
const pause = () => new Promise<void>((r) => setTimeout(r, 1200));

/** The /contact form (ContactForm) calls this. Every check is repeated here: the browser's can be skipped. */
export async function submitContact(form: FormData): Promise<ContactResult> {
  return handleContact(form, {
    ipKey: async () => clientIpKey(await headers()),
    guard,
    // Vercel BotID (https://vercel.com/docs/botid/get-started): the page path is listed in src/instrumentation-client.ts.
    // In `next dev` it "always returns `{ isBot: false }`" (https://vercel.com/docs/botid/local-development-behavior).
    isBot: async () => !dryRun && (await checkBotId()).isBot,
    inUs: async () => candidateFormOpen(await headers()),
    record: dryRun ? pause : (fields, resume) => recordSubmission(ezekia(), fields, resume),
    emailConfig: () => (dryRun ? { to: "dry-run", from: "dry-run" } : emailConfig()),
    emailEmployer: dryRun ? async () => true : (config, fields) => emailEmployer(sendEmail, config, fields),
  });
}
