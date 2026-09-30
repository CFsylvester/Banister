// 0003-create-heroImage — hero media option: exactly one image. Same limits as heroSlides (0002).
import type { MigrationFunction } from "contentful-migration";

const run: MigrationFunction = (migration) => {
  const image = migration.createContentType("heroImage").name("Hero: Image").displayField("internalName")
    .description("A single hero image.");

  image.createField("internalName").name("Internal name").type("Symbol").required(true)
    .validations([{ size: { min: 3, max: 100 } }]);
  image.changeFieldControl("internalName", "builtin", "singleLine", { helpText: "For editors only — e.g. “About — hero image”." });

  image.createField("image").name("Image").type("Link").linkType("Asset").required(true)
    .validations([
      { linkMimetypeGroup: ["image"] },
      { assetImageDimensions: { width: { min: 1200 }, height: {} }, message: "The image must be at least 1200 px wide" },
      { assetFileSize: { max: 10485760 }, message: "The image must be 10 MB or smaller" },
    ]);
  image.changeFieldControl("image", "builtin", "assetLinkEditor", { helpText: "One image, at least 1200 px wide." });
};
export default run;
