"use server";
import { checkBotId } from "botid/server";
import { headers } from "next/headers";
import { ezekia } from "@/lib/ezekia";
import { subscribeToList } from "@/lib/ezekia/subscribe";
import { clientIpKey } from "@/lib/rate-limit";
import { createSignupGuard, handleSubscribe, type SubscribeResult } from "@/lib/subscribe-handler";

/** Ezekia list "Website Sign Up - Whitepaper" (https://ezekia.com/#/lists/1003445/info). */
const SIGNUP_LIST_ID = 1003445;

const guard = createSignupGuard();

/** The hosts the contact form's dry run accepts (dryRunAllowed in src/lib/contact/handler.ts), which also needs a flag. */
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/** The yellow sign-up band (SubscribeBand) calls this. Validation is repeated here: the client's can be skipped. */
export async function subscribe(form: FormData): Promise<SubscribeResult> {
  return handleSubscribe(form, {
    ipKey: async () => clientIpKey(await headers()),
    guard,
    // Vercel BotID (https://vercel.com/docs/botid/get-started): every page path is listed in src/instrumentation-client.ts,
    // since the band is on every page. Skipped only off Vercel for requests addressed to localhost, where the client
    // never attaches the challenge (that file) and a local `next start` has no OIDC token for the server check
    // (node_modules/botid/dist/server/index.mjs, 1.5.13). On Vercel, VERCEL=1 at runtime keeps the check on whatever the
    // Host header says, when the project exposes system env vars
    // (https://vercel.com/docs/environment-variables/system-environment-variables); without it the host test still
    // applies. In `next dev` it "always returns `{ isBot: false }`" (https://vercel.com/docs/botid/local-development-behavior).
    isBot: async () =>
      (Boolean(process.env.VERCEL) || !LOCAL_HOST.test((await headers()).get("host") ?? "")) && (await checkBotId()).isBot,
    addToList: (email) => subscribeToList(ezekia(), SIGNUP_LIST_ID, email),
  });
}
