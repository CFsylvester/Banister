#!/usr/bin/env node
// sync-assets.mjs — before `next build`, put every image the site REFERENCES into public/cms/<assetId>.<ext>,
// using the same path rule as the render path (src/lib/cms/asset-path.ts). Research R7: images are copied into
// the static build so the live site never depends on Contentful's CDN. Only referenced images are synced
// (heroes' images + image), so an unrelated upload elsewhere in the space can't break or bloat the build;
// files no longer referenced are pruned. Revision stamps live in .cache/cms/, not in the shipped folder.
//   CONTENT_SOURCE=fixture    → copy the files listed in contentful/seed/home.json
//   CONTENT_SOURCE=contentful → fetch via the Content Delivery API (read token only)
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { extFor, sniffImageType } from "../../src/lib/cms/asset-path.ts";

const out = resolve("public/cms"), stamps = resolve(".cache/cms");
mkdirSync(out, { recursive: true }); mkdirSync(stamps, { recursive: true });
const src = process.env.CONTENT_SOURCE ?? "contentful";
const keep = new Set(); let written = 0;
const supported = (type) => { try { extFor(type); return true; } catch { return false; } };

if (src === "fixture") {
  const seed = JSON.parse(readFileSync("contentful/seed/home.json", "utf8"));
  for (const a of seed.assets) {
    const bytes = readFileSync(resolve(a.file));
    const name = `${a.id}${extFor(sniffImageType(bytes))}`;
    writeFileSync(`${out}/${name}`, bytes); keep.add(name); written++;
  }
} else if (src === "contentful") {
  const missing = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_DELIVERY_TOKEN"].filter((k) => !process.env[k]);
  if (missing.length) { console.error(`sync-assets: missing ${missing.join(", ")} (set them in .envrc, or use CONTENT_SOURCE=fixture)`); process.exit(2); }
  const { createClient } = await import("contentful");
  const client = createClient({ space: process.env.CONTENTFUL_SPACE_ID, accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master" }).withoutUnresolvableLinks;
  // Referenced images: every published hero's images + image (the only image fields in the model today).
  const assets = new Map();
  for (let skip = 0; ; skip += 100) {
    const page = await client.getEntries({ content_type: "hero", include: 1, limit: 100, skip });
    for (const h of page.items) for (const a of [...(h.fields.images ?? []), h.fields.image].filter(Boolean)) assets.set(a.sys.id, a);
    if (skip + page.items.length >= page.total) break;
  }
  for (const a of assets.values()) {
    const file = a.fields.file;
    if (!file?.url || !supported(file.contentType)) { console.warn(`sync-assets: skipping ${a.sys.id} (${file?.contentType ?? "no file"}) — the build will name the hero that uses it`); continue; }
    const name = `${a.sys.id}${extFor(file.contentType)}`, stamp = `${stamps}/${name}.v${a.sys.revision}`;
    keep.add(name);
    if (existsSync(`${out}/${name}`) && existsSync(stamp)) continue; // unchanged since last sync
    const res = await fetch(`https:${file.url}`);
    if (!res.ok) { console.error(`sync-assets: ${a.sys.id} HTTP ${res.status}`); process.exit(1); }
    writeFileSync(`${out}/${name}`, Buffer.from(await res.arrayBuffer())); writeFileSync(stamp, ""); written++;
  }
} else { console.error(`sync-assets: CONTENT_SOURCE must be fixture|contentful, got ${src}`); process.exit(2); }

let pruned = 0;
for (const f of readdirSync(out)) if (!keep.has(f) && statSync(`${out}/${f}`).isFile()) { unlinkSync(`${out}/${f}`); pruned++; }
for (const f of readdirSync(stamps)) if (!keep.has(f.replace(/\.v\d+$/, ""))) unlinkSync(`${stamps}/${f}`);
console.log(`sync-assets (${src}): ${keep.size} image(s) in public/cms/ (${written} written, ${pruned} stale removed)`);
