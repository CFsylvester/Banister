#!/usr/bin/env node
// cms:migrate --env <id> [--approve] — apply contentful/migrations/NNNN-*.ts in order (one content model per
// file) with contentful-migration's runMigration({ migrationFunction, spaceId, accessToken, environmentId, yes });
// the .ts files are imported natively (Node 22 type stripping)
// (node_modules/contentful-migration/README.md). Applied migrations are recorded in a `cmsMigrationLog`
// entry so reruns skip them. Prints each migration's header comment as the plain-language summary.
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { defaultLocale, die, environment, getOrNull, targetEnv } from "./lib.mjs";

const require = createRequire(import.meta.url);
const { runMigration } = require("contentful-migration");
const envId = targetEnv();
const { env } = await environment(envId);
const loc = await defaultLocale(env);

// Bootstrap the log type (outside the numbered migrations so it never collides with model history).
let ct = await getOrNull(() => env.getContentType("cmsMigrationLog"));
if (!ct) {
  ct = await env.createContentTypeWithId("cmsMigrationLog", { name: "CMS migration log (do not edit)", displayField: "name",
    fields: [{ id: "name", name: "Name", type: "Symbol", required: true }, { id: "applied", name: "Applied", type: "Array", items: { type: "Symbol" } }] });
  ct = await ct.publish();
}
let log = await getOrNull(() => env.getEntry("cmsMigrationLog"));
if (!log) { log = await env.createEntryWithId("cmsMigrationLog", "cmsMigrationLog", { fields: { name: { [loc]: "migrations" }, applied: { [loc]: [] } } }); }
const applied = new Set(log.fields.applied?.[loc] ?? []);

const dir = resolve("contentful/migrations");
const pending = readdirSync(dir).filter((f) => /^\d{4}-.*\.ts$/.test(f)).sort().filter((f) => !applied.has(f));
if (!pending.length) { console.log(`cms: ${envId} is up to date (${applied.size} applied)`); process.exit(0); }

for (const f of pending) {
  const summary = readFileSync(resolve(dir, f), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.replace(/^\/\/ ?/, "  ")).join("\n");
  console.log(`\n── ${f} → environment "${envId}"\n${summary}\n`);
  try {
    const migrationFunction = (await import(pathToFileURL(resolve(dir, f)).href)).default;
    await runMigration({ migrationFunction, spaceId: process.env.CONTENTFUL_SPACE_ID,
      accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN, environmentId: envId, yes: true });
  } catch (e) { die(`${f} failed: ${e.message}`, 1); }
  applied.add(f);
  log.fields.applied = { [loc]: [...applied] };
  log = await log.update();
  console.log(`cms: applied ${f}`);
}
await log.publish().catch(() => {});
console.log(`\ncms: ${pending.length} migration(s) applied to "${envId}". Next: pnpm cms:seed --env ${envId}`);
