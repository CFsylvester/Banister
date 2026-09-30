// 0004-add-internalPage-to-button — the Internal target of a button: a reference to a page; the site takes the
// URL from that page's slug. Separate from 0001 because `page` (0003) must exist before a field can be limited
// to it (page → hero → button → page is a reference cycle across types).
import type { MigrationFunction } from "contentful-migration";

const run: MigrationFunction = (migration) => {
  const button = migration.editContentType("button");
  button.createField("internalPage").name("Internal page").type("Link").linkType("Entry").required(false)
    .validations([{ linkContentType: ["page"] }]);
  button.moveField("internalPage").afterField("pageType");
  button.changeFieldControl("internalPage", "builtin", "entryLinkEditor", { helpText: "Used when Page type is Internal. Links to that page's URL." });
};
export default run;
