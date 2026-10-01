// Contentful publish webhook → should we refresh the site? Pure (no Next imports) so it is unit-tested.
// Authentication: Contentful webhooks can send headers marked `secret` (contentful-management 12.19.0,
// dist/types/entities/webhook.d.ts `WebhookHeader.secret`); scripts/cms/webhook.mjs configures one with
// REVALIDATE_SECRET. The webhook is also filtered to one environment on Contentful's side
// (`sys.environment.sys.id`); the environment check here is defence in depth. That the publish payload carries
// `sys.environment.sys.id` is [unverified] — when it is absent, the secret alone decides.
import { timingSafeEqual } from "node:crypto";

export const SECRET_HEADER = "x-banister-revalidate-secret";

export type Verdict =
  | { action: "revalidate" }
  | { action: "ignore"; status: 202; reason: string }
  | { action: "reject"; status: 401 | 500; reason: string };

const sameSecret = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function judgeWebhook(input: {
  secretHeader: string | null;
  expectedSecret: string | undefined;
  rawBody: string;
  expectedEnv: string;
}): Verdict {
  if (!input.expectedSecret) return { action: "reject", status: 500, reason: "REVALIDATE_SECRET is not configured" };
  if (!input.secretHeader || !sameSecret(input.secretHeader, input.expectedSecret))
    return { action: "reject", status: 401, reason: "bad or missing secret" };
  let env: unknown;
  try { env = (JSON.parse(input.rawBody || "{}") as { sys?: { environment?: { sys?: { id?: unknown } } } })?.sys?.environment?.sys?.id; }
  catch { env = undefined; } // an unparsable body can't name another environment; the secret already matched
  if (typeof env === "string" && env !== input.expectedEnv)
    return { action: "ignore", status: 202, reason: `publish in "${env}", this site reads "${input.expectedEnv}"` };
  return { action: "revalidate" };
}
