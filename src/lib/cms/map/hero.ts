// page → hero props. Pure (no I/O, no SDK types) — unit-tested in hero.test.ts.
import { ContentError, required } from "../errors.ts";
import { localAssetPath } from "../asset-path.ts";
import type { ButtonFields, CmsEntry, HeroFields, PageFields, RichTextDocument, RichTextNode } from "../types.ts";

export type ButtonProps = { label: string; href: string; external: boolean };
export type HeroProps = {
  title: RichTextDocument;
  /** Stored for the owner's later logic (e.g. hide slides when off); not acted on yet. */
  isAnimated: boolean;
  media: { kind: "slides" | "image"; images: string[] };
};

const EXTERNAL = /^https:\/\/\S+$/;

/** A page's URL from its slug: "home" is the site root, anything else is /<slug> (migration 0003). */
export function pageHref(page: CmsEntry<PageFields>): string {
  const slug = required(page, "slug");
  return slug === "home" ? "/" : `/${slug}`;
}

/**
 * Validate + shape a button. Page type decides the target (Contentful can't require fields conditionally):
 * Internal → internalPage (its slug becomes the URL); External → externalUrl (https, new tab).
 */
export function mapButton(b: CmsEntry<ButtonFields>): ButtonProps {
  const label = required(b, "label");
  const pageType = required(b, "pageType");
  if (pageType === "Internal") return { label, href: pageHref(required(b, "internalPage")), external: false };
  if (pageType === "External") {
    const url = required(b, "externalUrl");
    if (!EXTERNAL.test(url)) throw new ContentError(b.contentType, b.id, "externalUrl", "must be an https:// URL");
    return { label, href: url, external: true };
  }
  throw new ContentError(b.contentType, b.id, "pageType", `must be Internal or External, got ${String(pageType)}`);
}

/** Every button embedded in the title must be a valid `button` entry (fails the build otherwise). */
function checkEmbeds(nodes: RichTextNode[] | undefined, hero: CmsEntry<HeroFields>): void {
  for (const n of nodes ?? []) {
    if (n.nodeType === "embedded-entry-inline" || n.nodeType === "embedded-entry-block") {
      const t = n.data.target as CmsEntry<ButtonFields> | undefined;
      if (!t || !("contentType" in t)) throw new ContentError(hero.contentType, hero.id, "title", "embeds an entry that is missing or unpublished");
      if (t.contentType !== "button") throw new ContentError(hero.contentType, hero.id, "title", `embeds a ${t.contentType}; only buttons are allowed`);
      mapButton(t);
    }
    checkEmbeds(n.content, hero);
  }
}

export function mapHero(page: CmsEntry<PageFields>): HeroProps {
  const hero = required(page, "hero");
  const title = required(hero, "title");
  checkEmbeds(title.content, hero);

  // Slides win: if slides has images use them (≥ 3), otherwise the single image is required (migration 0002).
  const slides = hero.fields.slides ?? [];
  let out: HeroProps["media"];
  if (slides.length) {
    if (slides.length < 3) throw new ContentError(hero.contentType, hero.id, "slides", "needs at least 3 images");
    out = { kind: "slides", images: slides.map(localAssetPath) };
  } else if (hero.fields.image) {
    out = { kind: "image", images: [localAssetPath(hero.fields.image)] };
  } else throw new ContentError(hero.contentType, hero.id, "slides/image", "needs slides (3+ images) or an image");

  return { title, isAnimated: hero.fields.isAnimated ?? true, media: out };
}
