#!/usr/bin/env node
// sync-assets.mjs — materialize every CMS image into public/cms/<assetId>.<ext> before `next build`, using
// the same path rule the render path uses (src/lib/cms/asset-path.ts). Research R7: images are downloaded at
// build so the static site never depends on Contentful's CDN at runtime.
//   CONTENT_SOURCE=fixture    → copy the files listed in contentful/seed/home.json
//   CONTENT_SOURCE=contentful → fetch published assets via the Content Delivery API (read token only)
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { extFor, sniffImageType } from "../../src/lib/cms/asset-path.ts";

const out = resolve("public/cms");
mkdirSync(out, { recursive: true });
const src = process.env.CONTENT_SOURCE ?? "contentful";
let n = 0;

if (src === "fixture") {
  const seed = JSON.parse(readFileSync("contentful/seed/home.json", "utf8"));
  for (const a of seed.assets) {
    const bytes = readFileSync(resolve(a.file));
    writeFileSync(`${out}/${a.id}${extFor(sniffImageType(bytes))}`, bytes); n++;
  }
} else if (src === "contentful") {
  const missing = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_DELIVERY_TOKEN"].filter((k) => !process.env[k]);
  if (missing.length) { console.error(`sync-assets: missing ${missing.join(", ")} (set them in .envrc, or use CONTENT_SOURCE=fixture)`); process.exit(2); }
  const { createClient } = await import("contentful");
  const client = createClient({ space: process.env.CONTENTFUL_SPACE_ID, accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN,
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master" });
  for (let skip = 0; ; skip += 100) {
    const page = await client.getAssets({ limit: 100, skip });
    for (const a of page.items) {
      const file = a.fields.file;
      if (!file?.url || !String(file.contentType).startsWith("image/")) continue;
      const dest = `${out}/${a.sys.id}${extFor(file.contentType)}`;
      const stamp = `${dest}.v${a.sys.revision}`;
      if (existsSync(dest) && existsSync(stamp)) continue; // unchanged since last sync
      const res = await fetch(`https:${file.url}`);
      if (!res.ok) { console.error(`sync-assets: ${a.sys.id} HTTP ${res.status}`); process.exit(1); }
      writeFileSync(dest, Buffer.from(await res.arrayBuffer())); writeFileSync(stamp, ""); n++;
    }
    if (skip + page.items.length >= page.total) break;
  }
} else { console.error(`sync-assets: CONTENT_SOURCE must be fixture|contentful, got ${src}`); process.exit(2); }
console.log(`sync-assets (${src}): ${n} image(s) written to public/cms/`);
