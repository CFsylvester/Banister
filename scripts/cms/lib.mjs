// Shared plumbing for the CMS setup scripts. Management (write) token ONLY here — never imported by app code.
// Env comes from direnv (.envrc, git-ignored): CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN.
// Safety rule (constitution VI / FR-010): scripts refuse the `master` environment unless --approve is passed.
import { createClient } from "contentful-management";

export const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i !== -1 ? process.argv[i + 1] : d; };
export const has = (k) => process.argv.includes(`--${k}`);
export const die = (msg, code = 2) => { console.error(`cms: ${msg}`); process.exit(code); };

export function targetEnv() {
  const env = arg("env");
  if (!env) die("pass --env <environment-id> (a sandbox first; master needs --approve)");
  if (env === "master" && !has("approve")) die("refusing to change master without --approve (apply to a sandbox and get owner approval first)");
  return env;
}

export async function environment(envId) {
  const missing = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_MANAGEMENT_TOKEN"].filter((k) => !process.env[k]);
  if (missing.length) die(`missing ${missing.join(", ")} — add them to .envrc and run \`direnv allow\``);
  const client = createClient({ accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN });
  const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID);
  return { space, env: envId ? await space.getEnvironment(envId) : null };
}

// contentful-sdk-core's errorHandler names errors by the API error sys.id ("NotFound"), falling back to
// "<status> <statusText>" (node_modules/.pnpm/contentful-sdk-core@*/…/dist/error-handler.js).
export const isNotFound = (e) => e?.name === "NotFound" || /^404\b/.test(String(e?.name));
/** Resolve to null on 404; rethrow anything else (auth, rate limit, validation). */
export const getOrNull = (fn) => fn().catch((e) => { if (isNotFound(e)) return null; throw e; });

export async function defaultLocale(env) {
  const locales = await env.getLocales();
  const def = locales.items.find((l) => l.default);
  if (!def) die("no default locale in this environment", 1);
  return def.code;
}
