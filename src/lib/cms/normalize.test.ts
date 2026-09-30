import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, type Node, type Sys } from "./normalize.ts";
import type { ButtonFields, CmsEntry, HeroFields, PageFields } from "./types.ts";

// Fixture-style records: links are { sys: { type: "Link" } } and resolved through a lookup, like the seed.
const link = (id: string) => ({ sys: { type: "Link", linkType: "Entry", id } });
const entry = (id: string, contentType: string, fields: Record<string, unknown>): Node =>
  ({ sys: { type: "Entry", id, contentType: { sys: { id: contentType } } }, fields });
const db = new Map<string, Node>([
  // A button on the Home hero that links to the Home page itself: page → hero → button → page (a real loop).
  ["page-home", entry("page-home", "page", { internalName: "Home", slug: "home", hero: link("hero-home") })],
  ["hero-home", entry("hero-home", "hero", { title: { nodeType: "document", data: {}, content: [
    { nodeType: "embedded-entry-block", data: { target: link("button-home") }, content: [] }] } })],
  ["button-home", entry("button-home", "button", { label: "HOME", pageType: "Internal", internalPage: link("page-home") })],
]);
const resolve = (sys: Sys) => db.get(sys.id!);

test("a reference loop terminates, and the looped page keeps its scalar fields (slug) for linking", () => {
  const page = normalize(db.get("page-home"), resolve) as CmsEntry<PageFields>;
  const hero = page.fields.hero as CmsEntry<HeroFields>;
  const button = hero.fields.title!.content[0].data.target as CmsEntry<ButtonFields>;
  assert.equal(button.fields.label, "HOME");
  const looped = button.fields.internalPage as CmsEntry<PageFields>;
  assert.equal(looped.id, "page-home");
  assert.equal(looped.fields.slug, "home");       // enough to build the button's URL
  assert.equal(looped.fields.hero, undefined);     // not expanded again
});

test("the same entry reached on two separate branches is expanded both times (only loops are cut)", () => {
  const shared = new Map<string, Node>([
    ["a", entry("a", "page", { slug: "a", left: link("s"), right: link("s") })],
    ["s", entry("s", "button", { label: "S" })],
  ]);
  const a = normalize(shared.get("a"), (sys) => shared.get(sys.id!)) as CmsEntry<Record<string, CmsEntry<ButtonFields>>>;
  assert.equal(a.fields.left.fields.label, "S");
  assert.equal(a.fields.right.fields.label, "S");
});
