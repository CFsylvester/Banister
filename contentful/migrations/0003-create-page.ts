// 0003-create-page — a page = slug + one hero + blocks in drag-and-drop order. Needs hero (0002).
//   slug: the page's URL — "home" is the site root (/), anything else is /<slug>/. Buttons link to pages by
//   reference and take the URL from this field.
// Block types come in later migrations, which will add a linkContentType validation to `blocks`.
import type { MigrationFunction } from "contentful-migration";

const run: MigrationFunction = (migration) => {
  const page = migration.createContentType("page").name("Page").displayField("internalName")
    .description("A page: one hero, then blocks in drag-and-drop order.");

  page.createField("internalName").name("Internal name").type("Symbol").required(true)
    .validations([{ size: { min: 3, max: 100 } }]);
  page.changeFieldControl("internalName", "builtin", "singleLine", { helpText: "For editors only — e.g. “Home”." });

  page.createField("slug").name("Slug").type("Symbol").required(true)
    .validations([{ unique: true }, { regexp: { pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" }, message: "Lowercase words joined by hyphens, e.g. contact" }]);
  page.changeFieldControl("slug", "builtin", "slugEditor",
    { trackingFieldId: "internalName", helpText: "The page's URL. Use home for the site root; otherwise it becomes /<slug>/." });

  page.createField("hero").name("Hero").type("Link").linkType("Entry").required(true)
    .validations([{ linkContentType: ["hero"] }]);
  page.changeFieldControl("hero", "builtin", "entryLinkEditor", { helpText: "The hero at the top of this page." });

  page.createField("blocks").name("Blocks").type("Array").required(false)
    .items({ type: "Link", linkType: "Entry" })
    .validations([{ size: { max: 0 }, message: "No block types exist yet" }]); // the first block migration lifts this
  page.changeFieldControl("blocks", "builtin", "entryLinksEditor", { helpText: "Sections below the hero. Drag to reorder." });
};
export default run;
