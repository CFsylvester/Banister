#!/usr/bin/env node
// cms:webhook --url https://<live-site>/api/revalidate/ --env master --approve
// Creates or updates THE Contentful webhook that calls the site's revalidate endpoint when content is published or
// unpublished in the live environment. A persistent, space-level setting, so it always needs --approve.
//   url:     must end in /api/revalidate/ — next.config.ts trailingSlash makes the slash-less path 308-redirect,
//            and whether Contentful's sender follows redirects is [unverified].
//   topics:  "*.publish", "*.unpublish" — "<Type>.<action>" with wildcards per the createWebhook example in
//            contentful-management 12.19.0 dist/types/create-space-api.d.ts ("*.publish", "Asset.*");
//            the "unpublish" action name is [unverified].
//   filters: sys.environment.sys.id in [<env>, plus the environment an alias named <env> points to]
//            (dist/types/entities/webhook.d.ts InConstraint; aliases via space.getEnvironmentAliases()).
//   headers: x-banister-revalidate-secret = REVALIDATE_SECRET, stored as a secret header (WebhookHeader.secret).
// One webhook per environment, matched by exact name "Banister — revalidate site (<env>)".
// ALIAS SWAPS: the filter (and LIVE_ENVIRONMENTS on Vercel) record the alias target at run time. After every
// alias change, re-run this script and update LIVE_ENVIRONMENTS, or publishes in the new target are dropped.
// Env (direnv .envrc): CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN, REVALIDATE_SECRET.
import { arg, die, environment, has, isNotFound } from "./lib.mjs";

const url = arg("url"), env = arg("env");
const parsed = URL.canParse(url ?? "") ? new URL(url) : null;
if (!parsed || parsed.protocol !== "https:" || parsed.pathname !== "/api/revalidate/" || parsed.search || parsed.hash || parsed.username || parsed.password)
  die("pass --url https://<site>/api/revalidate/ (https, trailing slash, no query, fragment or credentials)");
if (!env) die("pass --env <environment the live site reads> (normally master)");
if (!has("approve")) die("this changes the space's webhook settings — re-run with --approve");
if (!process.env.REVALIDATE_SECRET) die("set REVALIDATE_SECRET in .envrc (the same value as on Vercel)");

const PREFIX = "Banister — revalidate site";
const { space } = await environment(null);
// Spaces without the alias feature can't list aliases; treat that as "no aliases".
const aliases = await space.getEnvironmentAliases().catch((e) => {
  if (isNotFound(e)) return { items: [] };
  die(`could not read environment aliases (${e?.name ?? e}) — not changing the webhook`);
});
const target = aliases.items.find((a) => a.sys.id === env)?.environment?.sys?.id;
const envIds = [...new Set([env, target].filter(Boolean))];
const props = {
  name: `${PREFIX} (${env})`, url, active: true,
  topics: ["*.publish", "*.unpublish"],
  filters: [{ in: [{ doc: "sys.environment.sys.id" }, envIds] }],
  headers: [{ key: "x-banister-revalidate-secret", value: process.env.REVALIDATE_SECRET, secret: true }],
};
const mine = (await space.getWebhooks()).items.filter((w) => w.name === props.name);
if (mine.length > 1) die(`found ${mine.length} webhooks named "${props.name}" — keep one in Contentful, then re-run`);
if (mine[0]) {
  Object.assign(mine[0], props);
  await mine[0].update();
  console.log(`cms: updated webhook → ${url} (environments: ${envIds.join(", ")})`);
} else {
  await space.createWebhook(props);
  console.log(`cms: created webhook → ${url} (environments: ${envIds.join(", ")})`);
}
if (target) console.log(`cms: "${env}" is an alias of "${target}" — on Vercel, set LIVE_ENVIRONMENTS to ${target}.\n` +
  `cms: after any future alias change, re-run this script and update LIVE_ENVIRONMENTS.`);
