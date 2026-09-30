// Source-agnostic content shapes. Both sources (the Contentful delivery client and the offline fixture) are
// normalized into these, so the mappers and their tests never depend on SDK objects.

export type CmsAsset = {
  id: string;
  title: string;
  /** Contentful asset description → used as the image's alt text ("" = decorative). */
  description: string;
  /** MIME type of the actual bytes (image/png, image/jpeg, …) — decides the local file extension. */
  contentType: string;
};

export type RichTextDocument = {
  nodeType: "document";
  data: Record<string, unknown>;
  content: RichTextNode[];
};
export type RichTextNode = {
  nodeType: string;
  data: Record<string, unknown>;
  value?: string;
  marks?: { type: string }[];
  content?: RichTextNode[];
};

export type CmsEntry<F> = { id: string; contentType: string; fields: F };

export type StatisticFields = { label?: string; value?: number; suffix?: string };
export type TestimonialFields = { internalName?: string; quote?: string; attribution?: string };
export type InsightArticleFields = {
  title?: string;
  slug?: string;
  publishedDate?: string;
  tags?: string[];
  summary?: string;
  coverImage?: CmsAsset;
  homeCardImage?: CmsAsset;
};
export type HomePageFields = {
  internalName?: string;
  heroHeadline?: RichTextDocument;
  heroCtaLabel?: string;
  heroCtaHref?: string;
  heroSlides?: CmsAsset[];
  introLead?: string;
  introBody?: string;
  statsHeading?: string;
  stats?: CmsEntry<StatisticFields>[];
  testimonialsHeading?: string;
  testimonials?: CmsEntry<TestimonialFields>[];
  insightsHeading?: string;
  featuredInsights?: CmsEntry<InsightArticleFields>[];
};
