// 0002-create-heroSlides — hero media option: a slideshow of at least 3 images.
// Image limits per the kit's media rule ("validate to image/file and set size/dimension limits"):
// ≥ 1200 px wide, ≤ 10 MB [assumption — tune once the real image exports arrive].
import type { MigrationFunction } from "contentful-migration";

const run: MigrationFunction = (migration) => {
  const slides = migration.createContentType("heroSlides").name("Hero: Slides").displayField("internalName")
    .description("A slideshow for the hero — at least 3 images.");

  slides.createField("internalName").name("Internal name").type("Symbol").required(true)
    .validations([{ size: { min: 3, max: 100 } }]);
  slides.changeFieldControl("internalName", "builtin", "singleLine", { helpText: "For editors only — e.g. “Home — hero slides”." });

  slides.createField("images").name("Images").type("Array").required(true)
    .items({ type: "Link", linkType: "Asset", validations: [
      { linkMimetypeGroup: ["image"] },
      { assetImageDimensions: { width: { min: 1200 }, height: {} }, message: "Images must be at least 1200 px wide" },
      { assetFileSize: { max: 10485760 }, message: "Images must be 10 MB or smaller" },
    ] })
    .validations([{ size: { min: 3 }, message: "Slides need at least 3 images" }]);
  slides.changeFieldControl("images", "builtin", "assetLinksEditor", { helpText: "At least 3 images. Drag to reorder — they play in this order." });
};
export default run;
