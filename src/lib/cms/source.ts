import "server-only";
// Content source (specs/001-contentful-cms R2/R6; specs/002-vercel-publishing). Reads are cached with
// `'use cache'` + cacheLife('cms') + cacheTag(CMS_TAG); a Contentful publish calls revalidateTag(CMS_TAG) through
// /api/revalidate/ so the next full page load renders fresh content. Docs: node_modules/next/dist/docs/01-app/
// 03-api-reference/04-functions/cacheTag.md, cacheLife.md, revalidateTag.md.
//   CONTENT_SOURCE=fixture    → contentful/seed/*.json (no network, no credentials; used by CI + pixel gates)
//   CONTENT_SOURCE=contentful → Content Delivery API (default). Needs CONTENTFUL_SPACE_ID +
//                               CONTENTFUL_DELIVERY_TOKEN (+ optional CONTENTFUL_ENVIRONMENT, default master),
//                               exported by direnv from .envrc (git-ignored). Never NEXT_PUBLIC_.
// Both are normalized into the plain shapes in ./types.ts, so mappers don't depend on the SDK.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "contentful";
import { cacheLife, cacheTag } from "next/cache";
import type { TypePageSkeleton } from "@/types/contentful";
import { sniffImageType } from "./asset-path.ts";
import { normalize, type Node, type Sys } from "./normalize.ts";
import type { CmsEntry, PageFields } from "./types.ts";

type Source = "fixture" | "contentful";
function source(): Source {
  const s = process.env.CONTENT_SOURCE ?? "contentful";
  if (s !== "fixture" && s !== "contentful") throw new Error(`CONTENT_SOURCE must be "fixture" or "contentful", got ${JSON.stringify(s)}`);
  return s;
}

// ---------- fixture ----------
type SeedFile = {
  assets: { id: string; file: string; title: string; description: string }[];
  entries: { id: string; contentType: string; fields: Record<string, unknown> }[];
};
// Read once per server process: the seed is fixed for a deployment, so a revalidate re-renders from the same
// fixture (edit the seed → restart the server to see it).
let fixtureCache: { byId: Map<string, Node> } | null = null;
function fixture() {
  if (fixtureCache) return fixtureCache;
  const seed = JSON.parse(readFileSync(resolve("contentful/seed/home.json"), "utf8")) as SeedFile;
  const byId = new Map<string, Node>();
  for (const a of seed.assets) {
    const contentType = sniffImageType(readFileSync(resolve(a.file)));
    byId.set(a.id, { sys: { type: "Asset", id: a.id }, fields: { title: a.title, description: a.description, file: { contentType } } });
  }
  for (const e of seed.entries) byId.set(e.id, { sys: { type: "Entry", id: e.id, contentType: { sys: { id: e.contentType } } }, fields: e.fields });
  fixtureCache = { byId };
  return fixtureCache;
}
const fixtureLink = (sys: Sys) => {
  const hit = fixture().byId.get(sys.id!);
  if (!hit) throw new Error(`fixture: unresolved ${sys.linkType} link ${sys.id}`);
  return hit;
};
const fixtureEntries = (contentType: string) =>
  [...fixture().byId.values()].filter((n) => n.sys?.type === "Entry" && n.sys.contentType?.sys.id === contentType);

// ---------- contentful ----------
function client() {
  const missing = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_DELIVERY_TOKEN"].filter((k) => !process.env[k]);
  if (missing.length)
    throw new Error(`Missing ${missing.join(", ")} — set them in .envrc (direnv), or build offline with CONTENT_SOURCE=fixture`);
  return createClient({
    space: process.env.CONTENTFUL_SPACE_ID!,
    accessToken: process.env.CONTENTFUL_DELIVERY_TOKEN!,
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  }).withoutUnresolvableLinks; // unpublished/deleted links drop out of lists (research R2)
}
const noLinks = () => { throw new Error("unexpected unresolved link from the delivery API"); };

// ---------- public API ----------
/** Every CMS-derived page shares one tag: on a site this size, refreshing all of it on any publish is simplest. */
export const CMS_TAG = "cms";

/** A page by its slug ("home" = the site root). Slugs are unique (migration 0003); a missing page fails loudly. */
export async function getPage(slug: string): Promise<CmsEntry<PageFields>> {
  "use cache";
  cacheLife("cms"); // next.config.ts: hourly safety-net refresh; publishes invalidate it immediately via CMS_TAG
  cacheTag(CMS_TAG);
  if (source() === "fixture") {
    const hit = fixtureEntries("page").find((p) => p.fields?.slug === slug);
    if (!hit) throw new Error(`fixture: no page with slug "${slug}"`);
    return normalize(hit, fixtureLink) as CmsEntry<PageFields>;
  }
  // include: page(0) → hero(1) → title buttons(2) → their internal page(3); assets resolve at each level
  const res = await client().getEntries<TypePageSkeleton>({ content_type: "page", "fields.slug": slug, include: 3, limit: 1 });
  if (!res.items[0]) throw new Error(`Contentful: no published page with slug "${slug}"`);
  return normalize(res.items[0], noLinks) as CmsEntry<PageFields>;
}
