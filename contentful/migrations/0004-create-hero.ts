// 0004-create-hero — the top of a page (not a block). Needs button (0001), heroSlides (0002), heroImage (0003).
//   headline: rich text — bold only (renders teal); buttons embeddable inline or as their own line
//   isAnimated: yes/no — stored now; what it does is decided later
//   media: Slides OR Image (a single reference to either type)
import type { MigrationFunction } from "contentful-migration";

const run: MigrationFunction = (migration) => {
  const hero = migration.createContentType("hero").name("Hero").displayField("internalName")
    .description("The top of a page. Not a block — every page has exactly one.");

  hero.createField("internalName").name("Internal name").type("Symbol").required(true)
    .validations([{ size: { min: 3, max: 100 } }]);
  hero.changeFieldControl("internalName", "builtin", "singleLine", { helpText: "For editors only — e.g. “Home — hero”." });

  hero.createField("headline").name("Headline").type("RichText").required(true).validations([
    { enabledMarks: ["bold"], message: "Only bold is allowed — bold words render teal" },
    { enabledNodeTypes: ["embedded-entry-inline", "embedded-entry-block"], message: "Only text and embedded buttons" },
    { nodes: {
      "embedded-entry-inline": [{ linkContentType: ["button"], message: "Only buttons can be embedded" }],
      "embedded-entry-block": [{ linkContentType: ["button"], message: "Only buttons can be embedded" }],
    } },
  ]);
  hero.changeFieldControl("headline", "builtin", "richTextEditor",
    { helpText: "Bold words render teal. Insert a Button (Embed → Entry) inline or on its own line." });

  hero.createField("isAnimated").name("Animated").type("Boolean").required(true);
  hero.changeFieldControl("isAnimated", "builtin", "boolean", { trueLabel: "Yes", falseLabel: "No", helpText: "Animate the hero media." });

  hero.createField("media").name("Media").type("Link").linkType("Entry").required(true)
    .validations([{ linkContentType: ["heroSlides", "heroImage"], message: "Choose Slides or Image" }]);
  hero.changeFieldControl("media", "builtin", "entryLinkEditor", { helpText: "Slides (3+ images) or a single Image." });
};
export default run;
