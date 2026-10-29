// Check the Ezekia API token: prints the API user and the rate limit. Use after setting or rotating EZEKIA_API_TOKEN.
// Env (direnv .envrc): EZEKIA_API_TOKEN. Prints no secrets. Exit 0 = token works, 1 = rejected or unreachable.
import { createEzekiaClient } from "../../src/lib/ezekia/client.ts";

if (!process.env.EZEKIA_API_TOKEN) { console.error("ezekia: set EZEKIA_API_TOKEN in .envrc and run `direnv allow`"); process.exit(1); }
let limit = null;
const client = createEzekiaClient({
  token: process.env.EZEKIA_API_TOKEN,
  fetch: async (url, init) => { const res = await fetch(url, init); limit = res.headers.get("x-ratelimit-limit"); return res; },
});
try {
  const me = await client.me();
  console.log(`ezekia: OK — API user "${me.fullName}" (id ${me.id}); X-RateLimit-Limit: ${limit ?? "not sent"}`);
} catch (e) {
  console.error(`ezekia: ${e.message}`);
  process.exit(1);
}
