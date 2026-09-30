#!/usr/bin/env node
// cms:seed --env <id> [--approve] — idempotently upsert contentful/seed/home.json (the same data the offline
// fixture renders) into an environment, then publish. Deterministic IDs: reruns update, never duplicate (FR-011).
// Assets: createUpload → createAssetWithId(uploadFrom) → processForAllLocales → publish (contentful-management
// 12.19.0 typings, create-environment-api.d.ts).
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { extFor, sniffImageType } from "../../src/lib/cms/asset-path.ts";
import { defaultLocale, environment, getOrNull, targetEnv } from "./lib.mjs";

const envId = targetEnv();
const { env } = await environment(envId);
const loc = await defaultLocale(env);
const seed = JSON.parse(readFileSync("contentful/seed/home.json", "utf8"));
const count = { created: 0, updated: 0, unchanged: 0 };
const localize = (fields) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, { [loc]: v }]));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

for (const a of seed.assets) {
  const bytes = readFileSync(resolve(a.file));
  const contentType = sniffImageType(bytes);
  const fileName = basename(a.file).replace(/\.[a-z]+$/i, extFor(contentType));
  let asset = await getOrNull(() => env.getAsset(a.id));
  if (asset) {
    const meta = { title: { [loc]: a.title }, description: { [loc]: a.description } };
    if (same(asset.fields.title, meta.title) && same(asset.fields.description ?? { [loc]: "" }, meta.description)) { count.unchanged++; continue; }
    Object.assign(asset.fields, meta); asset = await asset.update(); count.updated++;
  } else {
    const upload = await env.createUpload({ file: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) });
    asset = await env.createAssetWithId(a.id, { fields: { title: { [loc]: a.title }, description: { [loc]: a.description },
      file: { [loc]: { contentType, fileName, uploadFrom: { sys: { type: "Link", linkType: "Upload", id: upload.sys.id } } } } } });
    asset = await asset.processForAllLocales();
    count.created++;
  }
  await asset.publish();
}

// Two passes, because references can loop (page → hero → button → page): first create/update every entry so
// every link target exists, then publish them all.
const saved = [];
for (const e of seed.entries) {
  const fields = localize(e.fields);
  let entry = await getOrNull(() => env.getEntry(e.id));
  if (entry) {
    if (same(entry.fields, fields)) count.unchanged++;
    else { entry.fields = fields; entry = await entry.update(); count.updated++; }
  } else { entry = await env.createEntryWithId(e.contentType, e.id, { fields }); count.created++; }
  saved.push(entry);
}
for (const entry of saved) if (!entry.isPublished() || entry.isUpdated()) await entry.publish();
console.log(`cms: seeded "${envId}" — ${count.created} created, ${count.updated} updated, ${count.unchanged} unchanged`);
