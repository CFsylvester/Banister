import { test } from "node:test";
import assert from "node:assert/strict";
import { mapButton, mapHero } from "./hero.ts";
import { ContentError } from "../errors.ts";
import type { CmsAsset, CmsEntry, HeroFields, PageFields, RichTextDocument, RichTextNode } from "../types.ts";

const img = (id: string): CmsAsset => ({ id, title: id, description: "", contentType: "image/png" });
const btn = (id: string, url = "/contact") => ({ id, contentType: "button", fields: { label: "GO", url } });
const text = (value: string, bold = false): RichTextNode => ({ nodeType: "text", value, marks: bold ? [{ type: "bold" }] : [], data: {} });
const doc = (...content: RichTextNode[]): RichTextDocument => ({ nodeType: "document", data: {}, content });
const para = (...content: RichTextNode[]): RichTextNode => ({ nodeType: "paragraph", data: {}, content });
const embed = (target: unknown, inline = false): RichTextNode =>
  ({ nodeType: inline ? "embedded-entry-inline" : "embedded-entry-block", data: { target: target as CmsEntry<unknown> }, content: [] });
const page = (hero: Partial<HeroFields>): CmsEntry<PageFields> => ({
  id: "home", contentType: "page",
  fields: { hero: { id: "hero-home", contentType: "hero", fields: {
    headline: doc(para(text("We "), text("Build", true), text(" Companies")), embed(btn("b1"))),
    isAnimated: true,
    mediaType: "Slides", slides: [img("a"), img("b"), img("c")],
    ...hero } } },
});

test("slides map to local image paths in editor order", () => {
  const p = mapHero(page({}));
  assert.deepEqual(p.media, { kind: "slides", images: ["/cms/a.png", "/cms/b.png", "/cms/c.png"] });
});

test("a single image hero", () => {
  const p = mapHero(page({ mediaType: "Image", image: img("x") }));
  assert.deepEqual(p.media, { kind: "image", images: ["/cms/x.png"] });
});

test("fewer than 3 slides fails the build, naming the entry", () => {
  assert.throws(() => mapHero(page({ slides: [img("a"), img("b")] })), /hero\/hero-home\.slides needs at least 3 images/);
});

test("the chosen media type's field is required (Contentful can't enforce this conditionally)", () => {
  assert.throws(() => mapHero(page({ mediaType: "Image", image: undefined })), /hero\/hero-home\.image is required/);
  assert.throws(() => mapHero(page({ mediaType: "Slides", slides: [] })), /hero\/hero-home\.slides is required/);
});

test("isAnimated is passed through (behavior decided later)", () => {
  assert.equal(mapHero(page({ isAnimated: false })).isAnimated, false);
});

test("embedded buttons may be inline or block; non-buttons and missing embeds fail", () => {
  const withInline = doc(para(text("Talk "), embed(btn("b2"), true)));
  assert.doesNotThrow(() => mapHero(page({ headline: withInline })));
  assert.throws(() => mapHero(page({ headline: doc(embed({ id: "q", contentType: "testimonial", fields: {} })) })), /only buttons are allowed/);
  assert.throws(() => mapHero(page({ headline: doc(embed(undefined)) })), /missing or unpublished/);
});

test("button URLs: site paths and https only", () => {
  assert.deepEqual(mapButton(btn("i")), { label: "GO", href: "/contact", external: false });
  assert.equal(mapButton(btn("e", "https://example.com/x")).external, true);
  assert.throws(() => mapButton(btn("bad", "javascript:alert(1)")), (e: unknown) => e instanceof ContentError && e.field === "url");
});

test("a page without a hero fails with the field named", () => {
  assert.throws(() => mapHero({ id: "home", contentType: "page", fields: {} }), /page\/home\.hero is required/);
});
