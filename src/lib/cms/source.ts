import "server-only";
// Build-time content source (specs/001-contentful-cms research R1/R2/R6).
//   CONTENT_SOURCE=fixture    → contentful/seed/*.json (no network, no credentials; used by CI + pixel gates)
//   CONTENT_SOURCE=contentful → Content Delivery API (default). Needs CONTENTFUL_SPACE_ID +
//                               CONTENTFUL_DELIVERY_TOKEN (+ optional CONTENTFUL_ENVIRONMENT, default master),
//                               exported by direnv from .envrc (git-ignored). Never NEXT_PUBLIC_.
// Both are normalized into the plain shapes in ./types.ts, so mappers don't depend on the SDK.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "contentful";
import type { TypeHomePageSkeleton, TypeInsightArticleSkeleton } from "@/types/contentful";
import { sniffImageType } from "./asset-path.ts";
import type { CmsAsset, CmsEntry, HomePageFields, InsightArticleFields } from "./types.ts";

type Source = "fixture" | "contentful";
function source(): Source {
  const s = process.env.CONTENT_SOURCE ?? "contentful";
  if (s !== "fixture" && s !== "contentful") throw new Error(`CONTENT_SOURCE must be "fixture" or "contentful", got ${JSON.stringify(s)}`);
  return s;
}

// ---------- normalization (SDK objects and fixture records → CmsEntry / CmsAsset) ----------
type Sys = { type?: string; id?: string; linkType?: string; contentType?: { sys: { id: string } } };
type Node = { sys?: Sys; fields?: Record<string, unknown>; nodeType?: string };

function normalize(v: unknown, resolveLink: (sys: Sys) => unknown): unknown {
  if (Array.isArray(v)) return v.map((x) => normalize(x, resolveLink)).filter((x) => x !== undefined);
  if (!v || typeof v !== "object") return v;
  const n = v as Node;
  if (n.nodeType === "document") return v; // rich text: rendered as-is
  if (n.sys?.type === "Link") return normalize(resolveLink(n.sys), resolveLink);
  if (n.sys?.type === "Asset") {
    const f = n.fields as { title?: string; description?: string; file?: { contentType?: string } };
    return { id: n.sys.id!, title: f.title ?? "", description: f.description ?? "", contentType: f.file?.contentType ?? "" } satisfies CmsAsset;
  }
  if (n.sys?.type === "Entry") {
    const fields: Record<string, unknown> = {};
    for (const [k, fv] of Object.entries(n.fields ?? {})) fields[k] = normalize(fv, resolveLink);
    return { id: n.sys.id!, contentType: n.sys.contentType!.sys.id, fields } satisfies CmsEntry<unknown>;
  }
  return v;
}

// ---------- fixture ----------
type SeedFile = {
  assets: { id: string; file: string; title: string; description: string }[];
  entries: { id: string; contentType: string; fields: Record<string, unknown> }[];
};
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
export async function getHomePage(): Promise<CmsEntry<HomePageFields>> {
  if (source() === "fixture") {
    const [home] = fixtureEntries("homePage");
    if (!home) throw new Error("fixture: no homePage entry");
    return normalize(home, fixtureLink) as CmsEntry<HomePageFields>;
  }
  const res = await client().getEntries<TypeHomePageSkeleton>({ content_type: "homePage", include: 2, limit: 1 });
  if (!res.items[0]) throw new Error("Contentful: no published homePage entry");
  return normalize(res.items[0], noLinks) as CmsEntry<HomePageFields>;
}

export async function getInsightArticles(): Promise<CmsEntry<InsightArticleFields>[]> {
  if (source() === "fixture") return fixtureEntries("insightArticle").map((e) => normalize(e, fixtureLink) as CmsEntry<InsightArticleFields>);
  const res = await client().getEntries<TypeInsightArticleSkeleton>({ content_type: "insightArticle", include: 1, limit: 100 });
  return res.items.map((e) => normalize(e, noLinks) as CmsEntry<InsightArticleFields>);
}
