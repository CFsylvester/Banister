// 0001-homepage — content types for the homepage slice (specs/001-contentful-cms, Slice H).
// contentful-migration DSL (node_modules/contentful-migration/README.md). Validation keys checked against
// node_modules/contentful-migration/built/lib/offline-api/validator/schema/field-validations-schema.js.
// Additive only: creates types, never deletes (FR-010). Apply to a sandbox first: `pnpm cms:migrate --env <sandbox>`.
//
// Deviations from data-model.md, owner-approved for the slice:
//   • the hero CTA is a path Symbol (`heroCtaHref`), not a navigationLink reference;
//   • tags are a Symbol list on the article, not tag entries.

module.exports = function (migration) {
  const statistic = migration.createContentType("statistic").name("Statistic").displayField("label")
    .description("A track-record number that counts up on the homepage.");
  statistic.createField("label").name("Label").type("Symbol").required(true);
  statistic.createField("value").name("Value").type("Integer").required(true).validations([{ range: { min: 0 } }]);
  statistic.createField("suffix").name("Suffix").type("Symbol").required(false)
    .validations([{ size: { max: 3 } }]);

  const testimonial = migration.createContentType("testimonial").name("Testimonial").displayField("internalName")
    .description("A client quote. Reusable across pages.");
  testimonial.createField("internalName").name("Internal name").type("Symbol").required(true);
  testimonial.createField("quote").name("Quote").type("Text").required(true);
  testimonial.createField("attribution").name("Attribution").type("Symbol").required(true);

  const article = migration.createContentType("insightArticle").name("Insight article").displayField("title")
    .description("A white paper or article. Its slug becomes /insights/<slug>/.");
  article.createField("title").name("Title").type("Symbol").required(true);
  article.createField("slug").name("Slug").type("Symbol").required(true)
    .validations([{ unique: true }, { regexp: { pattern: "^[a-z0-9]+(-[a-z0-9]+)*$" }, message: "lowercase words joined by hyphens" }]);
  article.createField("publishedDate").name("Published date").type("Date").required(true);
  article.createField("tags").name("Tags").type("Array").required(true)
    .items({ type: "Symbol" }).validations([{ size: { min: 1, max: 4 } }]);
  article.createField("summary").name("Summary").type("Text").required(true);
  article.createField("coverImage").name("Cover image").type("Link").linkType("Asset").required(true)
    .validations([{ linkMimetypeGroup: ["image"] }]);
  article.createField("homeCardImage").name("Home card image (optional override)").type("Link").linkType("Asset")
    .required(false).validations([{ linkMimetypeGroup: ["image"] }]);

  const home = migration.createContentType("homePage").name("Home page").displayField("internalName")
    .description("The homepage. Section order is fixed by the design; every field is editable.");
  home.createField("internalName").name("Internal name").type("Symbol").required(true);
  home.createField("heroHeadline").name("Hero headline").type("RichText").required(true)
    .validations([{ enabledNodeTypes: [] }, { enabledMarks: ["bold"], message: "Bold only — bold words render teal." }]);
  home.createField("heroCtaLabel").name("Hero button label").type("Symbol").required(true);
  home.createField("heroCtaHref").name("Hero button link (site path)").type("Symbol").required(true)
    .validations([{ regexp: { pattern: "^/[a-z0-9/-]*$" }, message: "A site path such as /contact" }]);
  home.createField("heroSlides").name("Hero slides").type("Array").required(true)
    .items({ type: "Link", linkType: "Asset", validations: [{ linkMimetypeGroup: ["image"] }] })
    .validations([{ size: { min: 1, max: 6 } }]);
  home.createField("introLead").name("Intro lead").type("Text").required(true);
  home.createField("introBody").name("Intro body").type("Text").required(true);
  home.createField("statsHeading").name("Stats heading").type("Symbol").required(true);
  home.createField("stats").name("Stats").type("Array").required(true)
    .items({ type: "Link", linkType: "Entry", validations: [{ linkContentType: ["statistic"] }] })
    .validations([{ size: { min: 1, max: 8 } }]);
  home.createField("testimonialsHeading").name("Testimonials heading").type("Symbol").required(true);
  home.createField("testimonials").name("Testimonials").type("Array").required(true)
    .items({ type: "Link", linkType: "Entry", validations: [{ linkContentType: ["testimonial"] }] })
    .validations([{ size: { min: 1, max: 6 } }]);
  home.createField("insightsHeading").name("Insights heading").type("Symbol").required(true);
  home.createField("featuredInsights").name("Featured insights (up to 3)").type("Array").required(false)
    .items({ type: "Link", linkType: "Entry", validations: [{ linkContentType: ["insightArticle"] }] })
    .validations([{ size: { max: 3 } }]);
};
