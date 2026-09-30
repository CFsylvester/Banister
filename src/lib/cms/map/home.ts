// homePage entry → the props the existing (pixel-proven) homepage components take.
// Pure: no I/O, no SDK types — unit-tested in home.test.ts.
import { ContentError, required } from "../errors.ts";
import { localAssetPath } from "../asset-path.ts";
import type { CmsAsset, CmsEntry, HomePageFields, InsightArticleFields, RichTextDocument } from "../types.ts";

export type Img = { src: string; alt: string };
export type HomeCard = { img: string; tags: string[]; title: string; dek: string; href: string };
export type HomeProps = {
  hero: { headline: RichTextDocument; ctaLabel: string; ctaHref: string; slides: string[] };
  intro: { lead: string; body: string };
  stats: { heading: string; items: [number, string, string][] };
  testimonials: { heading: string; items: { text: string; who: string }[] };
  insights: { heading: string; cards: HomeCard[] };
  /** Non-fatal notes for the build log (e.g. a card linking to the listing because its page doesn't exist yet). */
  warnings: string[];
};

const img = (a: CmsAsset): Img => ({ src: localAssetPath(a), alt: a.description });

/**
 * @param home            the resolved homePage entry
 * @param allArticles     every published insightArticle (fills empty featured slots, newest first)
 * @param articleRoutes   slugs that have a built article page; others link to /insights (Slice H rule)
 */
export function mapHome(
  home: CmsEntry<HomePageFields>,
  allArticles: CmsEntry<InsightArticleFields>[],
  articleRoutes: ReadonlySet<string>,
): HomeProps {
  const warnings: string[] = [];

  const featured = home.fields.featuredInsights ?? [];
  const featuredIds = new Set(featured.map((a) => a.id));
  const fill = allArticles
    .filter((a) => !featuredIds.has(a.id))
    .sort((a, b) => required(b, "publishedDate").localeCompare(required(a, "publishedDate")));
  const cards = [...featured, ...fill].slice(0, 3).map((a): HomeCard => {
    const slug = required(a, "slug");
    const image = a.fields.homeCardImage ?? required(a, "coverImage");
    let href = `/insights/${slug}`;
    if (!articleRoutes.has(slug)) {
      href = "/insights";
      warnings.push(`insightArticle/${a.id}: no page for slug "${slug}" yet — home card links to /insights`);
    }
    return { img: img(image).src, tags: required(a, "tags"), title: required(a, "title"), dek: required(a, "summary"), href };
  });

  return {
    hero: {
      headline: required(home, "heroHeadline"),
      ctaLabel: required(home, "heroCtaLabel"),
      ctaHref: required(home, "heroCtaHref"),
      slides: required(home, "heroSlides").map((a) => img(a).src),
    },
    intro: { lead: required(home, "introLead"), body: required(home, "introBody") },
    stats: {
      heading: required(home, "statsHeading"),
      items: required(home, "stats").map((s) => {
        const value = required(s, "value");
        if (!Number.isInteger(value) || value < 0) throw new ContentError(s.contentType, s.id, "value", "must be a whole number ≥ 0");
        return [value, s.fields.suffix ?? "", required(s, "label")];
      }),
    },
    testimonials: {
      heading: required(home, "testimonialsHeading"),
      items: required(home, "testimonials").map((t) => ({ text: required(t, "quote"), who: required(t, "attribution") })),
    },
    insights: { heading: required(home, "insightsHeading"), cards },
    warnings,
  };
}
