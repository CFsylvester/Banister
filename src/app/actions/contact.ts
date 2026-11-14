"use server";
import { checkBotId } from "botid/server";
import { headers } from "next/headers";
import { emailConfig, emailEmployer } from "@/lib/contact/employer";
import { dryRunAllowed, handleContact, type ContactResult } from "@/lib/contact/handler";
import { recordSubmission } from "@/lib/contact/record";
import { sendEmail } from "@/lib/email";
import { ezekia } from "@/lib/ezekia";
import { candidateFormOpen } from "@/lib/geo";
import { clientIpKey } from "@/lib/rate-limit";
import { createSignupGuard } from "@/lib/subscribe-handler";

// Its own counters, separate from the sign-up band's, with the same limits and reasoning (subscribe-handler.ts): both
// spend calls from Ezekia's 5 req/s budget.
const guard = createSignupGuard();

/** In a dry run (dryRunAllowed: local only) everything is validated, then nothing is written and the reply comes after
 * the design's 1.2 s send. */
const pause = () => new Promise<void>((r) => setTimeout(r, 1200));

/** The /contact form (ContactForm) calls this. Every check is repeated here: the browser's can be skipped. */
export async function submitContact(form: FormData): Promise<ContactResult> {
  const dryRun = dryRunAllowed(process.env.CONTACT_DRY_RUN, (await headers()).get("host"));
  if (dryRun) console.warn("contact: CONTACT_DRY_RUN is on, nothing will be recorded or emailed");
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
