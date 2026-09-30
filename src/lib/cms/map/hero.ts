// page → hero props. Pure (no I/O, no SDK types) — unit-tested in hero.test.ts.
import { ContentError, required } from "../errors.ts";
import { localAssetPath } from "../asset-path.ts";
import type { ButtonFields, CmsEntry, HeroFields, HeroImageFields, HeroSlidesFields, PageFields, RichTextDocument, RichTextNode } from "../types.ts";

export type ButtonProps = { label: string; href: string; external: boolean };
export type HeroProps = {
  headline: RichTextDocument;
  /** Stored for the owner's later logic (e.g. hide slides when off); not acted on yet. */
  isAnimated: boolean;
  media: { kind: "slides" | "image"; images: string[] };
};

const INTERNAL = /^\/[a-z0-9/_-]*$/;
const EXTERNAL = /^https:\/\/\S+$/;

/** Validate + shape a button entry. Contentful's regexp also guards the URL; this catches fixture/legacy data. */
export function mapButton(b: CmsEntry<ButtonFields>): ButtonProps {
  const url = required(b, "url");
  if (!INTERNAL.test(url) && !EXTERNAL.test(url)) throw new ContentError(b.contentType, b.id, "url", "must be a site path like /contact or an https:// URL");
  return { label: required(b, "label"), href: url, external: EXTERNAL.test(url) };
}

/** Every button embedded in the headline must be a valid `button` entry (fails the build otherwise). */
function checkEmbeds(nodes: RichTextNode[] | undefined, hero: CmsEntry<HeroFields>): void {
  for (const n of nodes ?? []) {
    if (n.nodeType === "embedded-entry-inline" || n.nodeType === "embedded-entry-block") {
      const t = n.data.target as CmsEntry<ButtonFields> | undefined;
      if (!t || !("contentType" in t)) throw new ContentError(hero.contentType, hero.id, "headline", "embeds an entry that is missing or unpublished");
      if (t.contentType !== "button") throw new ContentError(hero.contentType, hero.id, "headline", `embeds a ${t.contentType}; only buttons are allowed`);
      mapButton(t);
    }
    checkEmbeds(n.content, hero);
  }
}

export function mapHero(page: CmsEntry<PageFields>): HeroProps {
  const hero = required(page, "hero");
  const headline = required(hero, "headline");
  checkEmbeds(headline.content, hero);

  const media = required(hero, "media");
  let out: HeroProps["media"];
  if (media.contentType === "heroSlides") {
    const images = required(media as CmsEntry<HeroSlidesFields>, "images");
    if (images.length < 3) throw new ContentError(media.contentType, media.id, "images", "needs at least 3 images");
    out = { kind: "slides", images: images.map(localAssetPath) };
  } else if (media.contentType === "heroImage") {
    out = { kind: "image", images: [localAssetPath(required(media as CmsEntry<HeroImageFields>, "image"))] };
  } else throw new ContentError(hero.contentType, hero.id, "media", `must be Slides or Image, got ${media.contentType}`);

  return { headline, isAnimated: hero.fields.isAnimated ?? true, media: out };
}
