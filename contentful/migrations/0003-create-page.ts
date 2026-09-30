// 0003-create-page — a page = one hero + blocks in drag-and-drop order. Needs hero (0002).
// Block types come in later migrations, which will add a linkContentType validation to `blocks`.
import type { MigrationFunction } from "contentful-migration";

const run: MigrationFunction = (migration) => {
  const page = migration.createContentType("page").name("Page").displayField("internalName")
    .description("A page: one hero, then blocks in drag-and-drop order.");

  page.createField("internalName").name("Internal name").type("Symbol").required(true)
    .validations([{ size: { min: 3, max: 100 } }]);
  page.changeFieldControl("internalName", "builtin", "singleLine", { helpText: "For editors only — e.g. “Home”." });

  page.createField("hero").name("Hero").type("Link").linkType("Entry").required(true)
    .validations([{ linkContentType: ["hero"] }]);
  page.changeFieldControl("hero", "builtin", "entryLinkEditor", { helpText: "The hero at the top of this page." });

  page.createField("blocks").name("Blocks").type("Array").required(false)
    .items({ type: "Link", linkType: "Entry" });
  page.changeFieldControl("blocks", "builtin", "entryLinksEditor", { helpText: "Sections below the hero. Drag to reorder." });
};
export default run;
