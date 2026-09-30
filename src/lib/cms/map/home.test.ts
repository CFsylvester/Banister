import { test } from "node:test";
import assert from "node:assert/strict";
import { mapHome } from "./home.ts";
import { ContentError } from "../errors.ts";
import type { CmsAsset, CmsEntry, HomePageFields, InsightArticleFields } from "../types.ts";

const asset = (id: string): CmsAsset => ({ id, title: id, description: "", contentType: "image/png" });
const article = (id: string, date: string, extra: Partial<InsightArticleFields> = {}): CmsEntry<InsightArticleFields> => ({
  id, contentType: "insightArticle",
  fields: { title: `T ${id}`, slug: id, publishedDate: date, tags: ["Article"], summary: "S", coverImage: asset(`c-${id}`), ...extra },
});
const home = (fields: Partial<HomePageFields> = {}): CmsEntry<HomePageFields> => ({
  id: "homePage", contentType: "homePage",
  fields: {
    heroHeadline: { nodeType: "document", data: {}, content: [] }, heroCtaLabel: "GO", heroCtaHref: "/contact",
    heroSlides: [asset("h1")], introLead: "L", introBody: "B", statsHeading: "S",
    stats: [{ id: "s1", contentType: "statistic", fields: { label: "things", value: 40, suffix: "+" } }],
    testimonialsHeading: "Q", testimonials: [{ id: "t1", contentType: "testimonial", fields: { quote: "q", attribution: "a" } }],
    insightsHeading: "I", featuredInsights: [], ...fields,
  },
});

test("featured articles come first, then the newest others fill up to 3", () => {
  const all = [article("old", "2026-01-01"), article("new", "2026-09-01"), article("mid", "2026-05-01"), article("pinned", "2025-01-01")];
  const p = mapHome(home({ featuredInsights: [all[3]] }), all, new Set(["pinned", "new", "mid", "old"]));
  assert.deepEqual(p.insights.cards.map((c) => c.title), ["T pinned", "T new", "T mid"]);
});

test("home card image overrides the cover image; cover is the fallback", () => {
  const a = article("a", "2026-01-01", { homeCardImage: asset("home-a") });
  const b = article("b", "2025-01-01");
  const p = mapHome(home({ featuredInsights: [a, b] }), [a, b], new Set(["a", "b"]));
  assert.deepEqual(p.insights.cards.map((c) => c.img), ["/cms/home-a.png", "/cms/c-b.png"]);
});

test("a card whose article page doesn't exist links to /insights and warns", () => {
  const a = article("no-page-yet", "2026-01-01");
  const p = mapHome(home({ featuredInsights: [a] }), [a], new Set());
  assert.equal(p.insights.cards[0].href, "/insights");
  assert.match(p.warnings[0], /insightArticle\/no-page-yet/);
});

test("a missing required field fails with the entry and field named (FR-017)", () => {
  assert.throws(() => mapHome(home({ introLead: "" }), [], new Set()),
    (e: unknown) => e instanceof ContentError && e.message === "Content error: homePage/homePage.introLead is required");
});

test("a non-integer statistic fails the build", () => {
  const bad = { id: "s9", contentType: "statistic", fields: { label: "x", value: 2.5 } };
  assert.throws(() => mapHome(home({ stats: [bad] }), [], new Set()), /statistic\/s9\.value must be a whole number/);
});

test("stats keep editor order and default an absent suffix to empty", () => {
  const s = (id: string, v: number, suffix?: string) => ({ id, contentType: "statistic", fields: { label: id, value: v, suffix } });
  const p = mapHome(home({ stats: [s("b", 2), s("a", 1, "%")] }), [], new Set());
  assert.deepEqual(p.stats.items, [[2, "", "b"], [1, "%", "a"]]);
});
