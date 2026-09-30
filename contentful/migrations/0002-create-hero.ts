// 0002-create-hero — ONE content model holding all hero content (owner, 2026-09-30). Not a block.
//   title      rich text: bold only (renders teal); `button` entries embeddable inline or on their own line
//   isAnimated yes/no — stored now; what it does is decided later
//   slides     ≥ 3 images — used when filled ("slides win")
//   image      one image  — used when slides is empty
// "Slides or image must be filled" is enforced by the site build (src/lib/cms/map/hero.ts) — Contentful can't
// make a field required conditionally. Needs button (0001).
// Conventions: agents-kit contentful skill + references/naming-and-modeling.md.
// Widget IDs: node_modules/contentful-management/dist/esm/constants/editor-interface-defaults/controls-defaults.mjs.
import type { IValidation, MigrationFunction } from "contentful-migration";

const IMAGE_RULES: IValidation[] = [
  { linkMimetypeGroup: ["image"] },
  { assetImageDimensions: { width: { min: 1200 }, height: {} }, message: "Images must be at least 1200 px wide" }, // [assumption] tune with real exports
  { assetFileSize: { max: 10485760 }, message: "Images must be 10 MB or smaller" },
];

const run: MigrationFunction = (migration) => {
  const hero = migration.createContentType("hero").name("Hero").displayField("internalName")
    .description("The top of a page. Not a block — every page has exactly one.");

  hero.createField("internalName").name("Internal name").type("Symbol").required(true)
    .validations([{ size: { min: 3, max: 100 } }]);
  hero.changeFieldControl("internalName", "builtin", "singleLine", { helpText: "For editors only — e.g. “Home — hero”." });

  hero.createField("title").name("Title").type("RichText").required(true).validations([
    { enabledMarks: ["bold"], message: "Only bold is allowed — bold words render teal" },
    { enabledNodeTypes: ["embedded-entry-inline", "embedded-entry-block"], message: "Only text and embedded buttons" },
    { nodes: {
      "embedded-entry-inline": [{ linkContentType: ["button"], message: "Only buttons can be embedded" }],
      "embedded-entry-block": [{ linkContentType: ["button"], message: "Only buttons can be embedded" }],
    } },
  ]);
  hero.changeFieldControl("title", "builtin", "richTextEditor",
    { helpText: "Bold words render teal. Insert a Button (Embed → Entry) inline or on its own line." });

  hero.createField("isAnimated").name("Animated").type("Boolean").required(true);
  hero.changeFieldControl("isAnimated", "builtin", "boolean", { trueLabel: "Yes", falseLabel: "No", helpText: "Animate the hero media." });

  hero.createField("slides").name("Slides").type("Array").required(false)
    .items({ type: "Link", linkType: "Asset", validations: IMAGE_RULES })
    .validations([{ size: { min: 3 }, message: "Slides need at least 3 images" }]);
  hero.changeFieldControl("slides", "builtin", "assetLinksEditor",
    { helpText: "At least 3 images; drag to reorder. If filled, slides are shown (Image is ignored)." });

  hero.createField("image").name("Image").type("Link").linkType("Asset").required(false)
    .validations(IMAGE_RULES);
  hero.changeFieldControl("image", "builtin", "assetLinkEditor", { helpText: "Shown when Slides is empty. One image." });
};
export default run;
