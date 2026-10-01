// Contentful publish webhook → should we refresh the site? Pure (no Next imports) so it is unit-tested.
// Authentication: Contentful webhooks can send headers marked `secret` (contentful-management 12.19.0,
// dist/types/entities/webhook.d.ts `WebhookHeader.secret`); scripts/cms/webhook.mjs configures one with
// REVALIDATE_SECRET. The webhook is also filtered to the live environment on Contentful's side
// (`sys.environment.sys.id`); the environment check here is defence in depth. That the publish payload carries
// `sys.environment.sys.id` is [unverified] — when it is absent, the secret alone decides.
// Environment aliases: if `master` is an alias, the payload may carry the target environment's id [unverified],
// so LIVE_ENVIRONMENTS (reported by scripts/cms/webhook.mjs) adds it to the accepted list.
import { createHash, timingSafeEqual } from "node:crypto";

export const SECRET_HEADER = "x-banister-revalidate-secret";
export const MAX_BODY_BYTES = 64 * 1024;

export type Verdict =
  | { action: "revalidate" }
  | { action: "ignore"; status: 202; reason: string }
  | { action: "reject"; status: 401 | 413 | 500; reason: string };

// Hash both sides first: equal-length digests, so the comparison leaks neither content nor length.
const digest = (v: string) => createHash("sha256").update(v).digest();
const sameSecret = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

/** Step 1, before reading the body: is the caller Contentful (right secret), and is the request small enough? */
export function checkCaller(input: { secretHeader: string | null; expectedSecret: string | undefined; contentLength: string | null }): Verdict {
  if (!input.expectedSecret) return { action: "reject", status: 500, reason: "server not configured" };
  if (!input.secretHeader || !sameSecret(input.secretHeader, input.expectedSecret)) return { action: "reject", status: 401, reason: "unauthorized" };
  if (Number(input.contentLength ?? 0) > MAX_BODY_BYTES) return { action: "reject", status: 413, reason: "payload too large" };
  return { action: "revalidate" };
}

/** Step 2, after reading the body: was the publish in an environment this site reads? */
export function checkEnvironment(rawBody: string, live: readonly string[]): Verdict {
  if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) return { action: "reject", status: 413, reason: "payload too large" };
  let env: unknown;
  try { env = (JSON.parse(rawBody || "{}") as { sys?: { environment?: { sys?: { id?: unknown } } } })?.sys?.environment?.sys?.id; }
  catch { env = undefined; } // an unparsable body can't name another environment; the secret already matched
  if (typeof env === "string" && !live.includes(env))
    return { action: "ignore", status: 202, reason: `publish in "${env}" is not a live environment` };
  return { action: "revalidate" };
}

/** Environments whose publishes refresh this site: CONTENTFUL_ENVIRONMENT (default master) plus LIVE_ENVIRONMENTS. */
export function liveEnvironments(env: Record<string, string | undefined>): string[] {
  const list = [env.CONTENTFUL_ENVIRONMENT || "master", ...(env.LIVE_ENVIRONMENTS ?? "").split(",")];
  return [...new Set(list.map((s) => s.trim()).filter(Boolean))];
}
