// page → hero props. Pure (no I/O, no SDK types) — unit-tested in hero.test.ts.
import { ContentError, required } from "../errors.ts";
import { extFor, localAssetPath } from "../asset-path.ts";
import type { ButtonFields, CmsAsset, CmsEntry, HeroFields, PageFields, RichTextDocument, RichTextNode } from "../types.ts";
import { SITE_ROUTES } from "../routes.ts";

export type ButtonProps = { label: string; href: string; external: boolean };
export type HeroProps = {
  title: RichTextDocument;
  /** Stored for the owner's later logic (e.g. hide the slideshow when off); not acted on yet. */
  isAnimated: boolean;
  media: { kind: "slides" | "image"; images: string[] };
};

const EXTERNAL = /^https:\/\/\S+$/;

/** A page's URL from its slug: "home" is the site root, anything else is /<slug> (migration 0003). */
export function pageHref(page: CmsEntry<PageFields>): string {
  const slug = required(page, "slug");
  return slug === "home" ? "/" : `/${slug}`;
}

/** Internal links must point at a route the static site actually builds, or the button ships a 404. */
function checkRoute(b: CmsEntry<ButtonFields>, page: CmsEntry<PageFields>): string {
  const slug = required(page, "slug");
  if (!SITE_ROUTES.has(slug)) throw new ContentError(b.contentType, b.id, "internalPage", `links to page "${slug}", which the site doesn't build yet`);
  return pageHref(page);
}

/**
 * Validate + shape a button. Page type decides the target (Contentful can't require fields conditionally):
 * Internal → internalPage (its slug becomes the URL); External → externalUrl (https, new tab).
 */
export function mapButton(b: CmsEntry<ButtonFields>): ButtonProps {
  const label = required(b, "label");
  const pageType = required(b, "pageType");
  if (pageType === "Internal") return { label, href: checkRoute(b, required(b, "internalPage")), external: false };
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
  // Buttons alone don't make a heading: the title needs at least one line with real text.
  const hasText = title.content.some((p) => p.nodeType === "paragraph" && (p.content ?? []).some((c) => c.nodeType === "text" && !!c.value?.trim()));
  if (!hasText) throw new ContentError(hero.contentType, hero.id, "title", "has no text — add a line of text (buttons alone don't make a heading)");

  // Images win: if `images` has entries use them as the slideshow (≥ 3), otherwise the single `image` (migration 0002).
  const images = hero.fields.images ?? [];
  // An asset with no file (or a non-image) would otherwise fail deep in the path rule without naming the hero.
  const path = (field: string) => (a: CmsAsset) => {
    const supported = (() => { try { extFor(a.contentType); return true; } catch { return false; } })();
    if (!supported) throw new ContentError(hero.contentType, hero.id, field,
      `links asset ${a.id}${a.contentType ? ` (${a.contentType})` : ""}, which isn't a supported image (png, jpeg, webp, gif, svg, avif)`);
    // Live content: Contentful's image CDN (an image published after the build must still render).
    // Offline fixture: the local copy synced into public/cms at build.
    return a.url ?? localAssetPath(a);
  };
  let out: HeroProps["media"];
  if (images.length) {
    // Unpublished images are dropped by the delivery API, so the count is of *published* images.
    if (images.length < 3) throw new ContentError(hero.contentType, hero.id, "images", "needs at least 3 published images");
    out = { kind: "slides", images: images.map(path("images")) };
  } else if (hero.fields.image) {
    out = { kind: "image", images: [path("image")(hero.fields.image)] };
  } else throw new ContentError(hero.contentType, hero.id, "images/image", "needs images (3+) or an image");

  return { title, isAnimated: hero.fields.isAnimated ?? true, media: out };
}
