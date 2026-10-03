import { test } from "node:test";
import assert from "node:assert/strict";
import { mapButton, mapHero, pageHref } from "./hero.ts";
import { ContentError } from "../errors.ts";
import type { ButtonFields, CmsAsset, CmsEntry, HeroFields, PageFields, RichTextDocument, RichTextNode } from "../types.ts";

const img = (id: string): CmsAsset => ({ id, title: id, description: "", contentType: "image/png" });
const pg = (slug: string): CmsEntry<PageFields> => ({ id: `page-${slug}`, contentType: "page", fields: { slug } });
const btn = (id: string, f: Partial<ButtonFields> = {}): CmsEntry<ButtonFields> =>
  ({ id, contentType: "button", fields: { label: "GO", pageType: "Internal", internalPage: pg("contact"), ...f } });
const text = (value: string, bold = false): RichTextNode => ({ nodeType: "text", value, marks: bold ? [{ type: "bold" }] : [], data: {} });
const doc = (...content: RichTextNode[]): RichTextDocument => ({ nodeType: "document", data: {}, content });
const para = (...content: RichTextNode[]): RichTextNode => ({ nodeType: "paragraph", data: {}, content });
const embed = (target: unknown, inline = false): RichTextNode =>
  ({ nodeType: inline ? "embedded-entry-inline" : "embedded-entry-block", data: { target: target as CmsEntry<unknown> }, content: [] });
const page = (hero: Partial<HeroFields>): CmsEntry<PageFields> => ({
  id: "page-home", contentType: "page",
  fields: { slug: "home", hero: { id: "hero-home", contentType: "hero", fields: {
    title: doc(para(text("We "), text("Build", true), text(" Companies")), embed(btn("b1"))),
    isAnimated: true,
    images: [img("a"), img("b"), img("c")],
    ...hero } } },
});

test("images map to local image paths in editor order (shown as the slideshow)", () => {
  assert.deepEqual(mapHero(page({})).media, { kind: "slides", images: ["/cms/a.png", "/cms/b.png", "/cms/c.png"] });
});

test("images win over image; image is used when images is empty", () => {
  assert.equal(mapHero(page({ image: img("x") })).media.kind, "slides");
  assert.deepEqual(mapHero(page({ images: [], image: img("x") })).media, { kind: "image", images: ["/cms/x.png"] });
});

test("fewer than 3 images, or no media at all, fails the build naming the hero", () => {
  assert.throws(() => mapHero(page({ images: [img("a"), img("b")] })), /hero\/hero-home\.images needs at least 3 published images/);
  assert.throws(() => mapHero(page({ images: [], image: undefined })), /hero\/hero-home\.images\/image needs images/);
});

test("isAnimated is passed through (behavior decided later)", () => {
  assert.equal(mapHero(page({ isAnimated: false })).isAnimated, false);
});

test("embedded buttons may be inline or block; non-buttons and missing embeds fail", () => {
  assert.doesNotThrow(() => mapHero(page({ title: doc(para(text("Talk "), embed(btn("b2"), true))) })));
  assert.throws(() => mapHero(page({ title: doc(embed({ id: "q", contentType: "testimonial", fields: {} })) })), /only buttons are allowed/);
  assert.throws(() => mapHero(page({ title: doc(embed(undefined)) })), /missing or unpublished/);
});

test("Internal buttons take the URL from the referenced page's slug; home is the root", () => {
  assert.deepEqual(mapButton(btn("i")), { label: "GO", href: "/contact", external: false });
  assert.equal(mapButton(btn("h", { internalPage: pg("home") })).href, "/");
  assert.equal(pageHref(pg("about-us")), "/about-us");
});

test("an Internal button to a page the site doesn't build fails instead of shipping a 404", () => {
  assert.throws(() => mapButton(btn("c", { internalPage: pg("careers") })), /button\/c\.internalPage links to page "careers"/);
});

test("a title with only buttons (no text) fails naming the hero", () => {
  assert.throws(() => mapHero(page({ title: doc(para(embed(btn("b3"), true))) })), /hero\/hero-home\.title has no text/);
});

test("an unsupported image type (e.g. TIFF) fails naming the hero, not deep in the path rule", () => {
  const tiff = { id: "scan", title: "", description: "", contentType: "image/tiff" };
  assert.throws(() => mapHero(page({ images: [img("a"), img("b"), tiff] })), /hero\/hero-home\.images links asset scan \(image\/tiff\)/);
});

test("a slide asset without an image file fails naming the hero and field", () => {
  const noFile = { id: "empty", title: "", description: "", contentType: "" };
  assert.throws(() => mapHero(page({ images: [img("a"), img("b"), noFile] })), /hero\/hero-home\.images links asset empty, which isn't a supported image/);
});

test("External buttons need an https URL; each page type requires its own field", () => {
  assert.deepEqual(mapButton(btn("e", { pageType: "External", externalUrl: "https://example.com/x" })),
    { label: "GO", href: "https://example.com/x", external: true });
  assert.throws(() => mapButton(btn("e2", { pageType: "External", externalUrl: "javascript:alert(1)" })),
    (e: unknown) => e instanceof ContentError && e.field === "externalUrl");
  assert.throws(() => mapButton(btn("i2", { internalPage: undefined })), /button\/i2\.internalPage is required/);
  assert.throws(() => mapButton(btn("e3", { pageType: "External" })), /button\/e3\.externalUrl is required/);
});

test("a page without a hero fails with the field named", () => {
  assert.throws(() => mapHero({ id: "page-home", contentType: "page", fields: { slug: "home" } }), /page\/page-home\.hero is required/);
});
