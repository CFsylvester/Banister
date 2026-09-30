// 0001-page-hero — the owner's page model (specs/001-contentful-cms, Slice H, revised 2026-09-30):
//   page   = hero (single reference) + blocks (ordered references; block types come later)
//   hero   = headline rich text (bold = teal; buttons embeddable inline or as blocks)
//            + isAnimated toggle (behavior decided later) + media (heroSlides OR heroImage)
//   heroSlides = at least 3 images · heroImage = exactly one image · button = label + url
// DSL: node_modules/contentful-migration/README.md. Validation keys (enabledNodeTypes, enabledMarks, nodes,
// linkContentType, linkMimetypeGroup, size, regexp) checked against
// node_modules/contentful-migration/built/lib/offline-api/validator/schema/field-validations-schema.js.
// Additive only (FR-010). Apply to a sandbox first: `pnpm cms:migrate --env <sandbox>`.

module.exports = function (migration) {
  const button = migration.createContentType("button").name("Button").displayField("label")
    .description("A call-to-action button. Embed it anywhere a rich-text field allows buttons.");
  button.createField("label").name("Label").type("Symbol").required(true);
  button.createField("url").name("URL").type("Symbol").required(true)
    .validations([{ regexp: { pattern: "^(/[a-z0-9/_-]*|https://\\S+)$" }, message: "A site path such as /contact, or a full https:// URL" }]);

  const slides = migration.createContentType("heroSlides").name("Hero: Slides")
    .description("A slideshow for the hero — at least 3 images.");
  slides.createField("images").name("Images").type("Array").required(true)
    .items({ type: "Link", linkType: "Asset", validations: [{ linkMimetypeGroup: ["image"] }] })
    .validations([{ size: { min: 3 }, message: "Slides need at least 3 images" }]);

  const image = migration.createContentType("heroImage").name("Hero: Image")
    .description("A single hero image.");
  image.createField("image").name("Image").type("Link").linkType("Asset").required(true)
    .validations([{ linkMimetypeGroup: ["image"] }]);

  const hero = migration.createContentType("hero").name("Hero")
    .description("The top of a page. Not a block — every page has exactly one.");
  hero.createField("headline").name("Headline").type("RichText").required(true).validations([
    { enabledMarks: ["bold"], message: "Only bold is allowed — bold words render teal" },
    { enabledNodeTypes: ["embedded-entry-inline", "embedded-entry-block"], message: "Only text and embedded buttons" },
    { nodes: {
      "embedded-entry-inline": [{ linkContentType: ["button"], message: "Only buttons can be embedded" }],
      "embedded-entry-block": [{ linkContentType: ["button"], message: "Only buttons can be embedded" }],
    } },
  ]);
  hero.createField("isAnimated").name("Animated").type("Boolean").required(true);
  hero.createField("media").name("Media (Slides or Image)").type("Link").linkType("Entry").required(true)
    .validations([{ linkContentType: ["heroSlides", "heroImage"] }]);

  const page = migration.createContentType("page").name("Page")
    .description("A page: one hero, then blocks in drag-and-drop order.");
  page.createField("hero").name("Hero").type("Link").linkType("Entry").required(true)
    .validations([{ linkContentType: ["hero"] }]);
  page.createField("blocks").name("Blocks").type("Array").required(false)
    .items({ type: "Link", linkType: "Entry" }); // allowed block types are added when blocks are built
};
