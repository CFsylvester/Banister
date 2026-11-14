import { initBotId } from "botid/client/core";

// Vercel BotID for the contact form's Server Action (src/app/actions/contact.ts). A Server Action is protected by the
// path of the page that calls it, and an unlisted path makes `checkBotId()` fail
// (https://vercel.com/docs/botid/get-started). The site uses `trailingSlash: true`, so the page is /contact/; the
// slash-less form is listed too in case a request arrives that way [unverified which one BotID compares — check on a
// Preview deployment, epic #88 T018]. /contact/outside-us/ serves the employer form to non-US visitors; src/proxy.ts
// rewrites to it without changing the address bar, but it can also be opened directly. Next loads this file before the
// app becomes interactive (node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation-client.md).
//
// Not on localhost: the patched fetch first awaits a challenge script that only Vercel serves (read in
// node_modules/botid/dist/client/core/index.mjs, 1.5.13), so under a local `next start` every protected POST fails
// before it is sent. Local runs use CONTACT_DRY_RUN instead (src/app/actions/contact.ts), which skips the server check.
const LOCAL = new Set(["localhost", "127.0.0.1", "[::1]"]);
if (!LOCAL.has(location.hostname)) {
  initBotId({
    protect: ["/contact/", "/contact", "/contact/outside-us/", "/contact/outside-us"].map((path) => ({ path, method: "POST" })),
  });
}
