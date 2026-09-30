// 0001-create-button — a reusable call-to-action, embedded in rich text (e.g. the hero title).
//   pageType     Internal | External
//   externalUrl  used when pageType = External (https only, opens in a new tab)
//   internalPage added in 0004 — it references `page`, which doesn't exist until 0003 (page → hero → button → page)
// Conditional requirement (Internal needs internalPage, External needs externalUrl) is enforced by the site build
// (src/lib/cms/map/hero.ts) — Contentful can't make a field required conditionally.
// Conventions: agents-kit contentful skill + references/naming-and-modeling.md. DSL: contentful-migration README.
// Widget IDs: node_modules/contentful-management/dist/esm/constants/editor-interface-defaults/controls-defaults.mjs.
import type { MigrationFunction } from "contentful-migration";

const run: MigrationFunction = (migration) => {
  const button = migration.createContentType("button").name("Button").displayField("internalName")
    .description("A call-to-action button. Embed it anywhere a rich-text field allows buttons.");

  button.createField("internalName").name("Internal name").type("Symbol").required(true)
    .validations([{ size: { min: 3, max: 100 } }]);
  button.changeFieldControl("internalName", "builtin", "singleLine",
    { helpText: "For editors only — e.g. “Button — Speak with a partner → Contact”." });

  button.createField("label").name("Label").type("Symbol").required(true)
    .validations([{ size: { min: 2, max: 40 } }]);
  button.changeFieldControl("label", "builtin", "singleLine", { helpText: "The text on the button, e.g. SPEAK WITH A PARTNER." });

  button.createField("pageType").name("Page type").type("Symbol").required(true)
    .validations([{ in: ["Internal", "External"] }]);
  button.changeFieldControl("pageType", "builtin", "dropdown",
    { helpText: "Internal → pick a page in Internal page. External → fill External URL." });

  button.createField("externalUrl").name("External URL").type("Symbol").required(false)
    .validations([{ regexp: { pattern: "^https://\\S+$" }, message: "A full https:// URL" }]);
  button.changeFieldControl("externalUrl", "builtin", "singleLine", { helpText: "Used when Page type is External. Opens in a new tab." });
};
export default run;
