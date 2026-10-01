#!/usr/bin/env node
// cms:webhook --url https://<live-site>/api/revalidate --env master --approve
// Creates or updates ONE Contentful webhook that calls the site's revalidate endpoint when content is published or
// unpublished in the given environment. A persistent, space-level setting, so it always needs --approve.
//   topics:  "*.publish", "*.unpublish" — format "<Type>.<action>" with wildcards per the createWebhook example in
//            contentful-management 12.19.0 dist/types/create-space-api.d.ts ("*.publish", "Asset.*");
//            the "unpublish" action name is [unverified].
//   filters: sys.environment.sys.id equals <env> (dist/types/entities/webhook.d.ts EqualityConstraint)
//   headers: x-banister-revalidate-secret = REVALIDATE_SECRET, stored as a secret header (WebhookHeader.secret)
// Env (direnv .envrc): CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN, REVALIDATE_SECRET.
import { arg, die, environment, has } from "./lib.mjs";

const url = arg("url"), env = arg("env");
if (!url || !/^https:\/\/\S+\/api\/revalidate\/?$/.test(url)) die("pass --url https://<site>/api/revalidate");
if (!env) die("pass --env <environment the live site reads> (normally master)");
if (!has("approve")) die("this changes the space's webhook settings — re-run with --approve");
if (!process.env.REVALIDATE_SECRET) die("set REVALIDATE_SECRET in .envrc (the same value as on Vercel)");

const NAME = `Banister — revalidate site (${env})`;
const props = {
  name: NAME, url, active: true,
  topics: ["*.publish", "*.unpublish"],
  filters: [{ equals: [{ doc: "sys.environment.sys.id" }, env] }],
  headers: [{ key: "x-banister-revalidate-secret", value: process.env.REVALIDATE_SECRET, secret: true }],
};
const { space } = await environment(null);
const existing = (await space.getWebhooks()).items.find((w) => w.name === NAME);
if (existing) {
  Object.assign(existing, props);
  await existing.update();
  console.log(`cms: updated webhook "${NAME}" → ${url}`);
} else {
  await space.createWebhook(props);
  console.log(`cms: created webhook "${NAME}" → ${url}`);
}
