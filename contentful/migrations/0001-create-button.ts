// 0001-create-button — a reusable call-to-action. Embedded in rich text (e.g. the hero headline) today.
// Conventions: agents-kit contentful skill + references/naming-and-modeling.md (one change per migration,
// validations on every field, help text for editors). DSL: node_modules/contentful-migration/README.md.
// Widget IDs: node_modules/contentful-management/dist/esm/constants/editor-interface-defaults/controls-defaults.mjs.
import type { MigrationFunction } from "contentful-migration";

const run: MigrationFunction = (migration) => {
  const button = migration.createContentType("button").name("Button").displayField("internalName")
    .description("A call-to-action button. Embed it anywhere a rich-text field allows buttons.");

  button.createField("internalName").name("Internal name").type("Symbol").required(true)
    .validations([{ size: { min: 3, max: 100 } }]);
  button.changeFieldControl("internalName", "builtin", "singleLine",
    { helpText: "For editors only — e.g. “Button — Speak with a partner (/contact)”." });

  button.createField("label").name("Label").type("Symbol").required(true)
    .validations([{ size: { min: 2, max: 40 } }]);
  button.changeFieldControl("label", "builtin", "singleLine", { helpText: "The text on the button, e.g. SPEAK WITH A PARTNER." });

  button.createField("url").name("URL").type("Symbol").required(true)
    .validations([{ regexp: { pattern: "^(/[a-z0-9/_-]*|https://\\S+)$" }, message: "A site path such as /contact, or a full https:// URL" }]);
  button.changeFieldControl("url", "builtin", "singleLine",
    { helpText: "A page on this site (/contact) or an external link (https://…). External links open in a new tab." });
};
export default run;
