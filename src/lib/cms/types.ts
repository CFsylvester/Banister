// Source-agnostic content shapes. Both sources (the Contentful delivery client and the offline fixture) are
// normalized into these, so the mappers and their tests never depend on SDK objects.
// Model: contentful/migrations/0001-page-hero.cjs.

export type CmsAsset = {
  id: string;
  title: string;
  /** Contentful asset description → used as the image's alt text ("" = decorative). */
  description: string;
  /** MIME type of the actual bytes (image/png, image/jpeg, …) — decides the local file extension. */
  contentType: string;
};

export type CmsEntry<F> = { id: string; contentType: string; fields: F };

/** Rich text as Contentful stores it. Embedded entries arrive resolved in `data.target` (normalized). */
export type RichTextNode = {
  nodeType: string;
  data: { target?: CmsEntry<unknown> | CmsAsset } & Record<string, unknown>;
  value?: string;
  marks?: { type: string }[];
  content?: RichTextNode[];
};
export type RichTextDocument = RichTextNode & { nodeType: "document"; content: RichTextNode[] };

export type ButtonFields = { internalName?: string; label?: string; url?: string };
export type HeroSlidesFields = { internalName?: string; images?: CmsAsset[] };
export type HeroImageFields = { internalName?: string; image?: CmsAsset };
export type HeroFields = {
  internalName?: string;
  headline?: RichTextDocument;
  isAnimated?: boolean;
  media?: CmsEntry<HeroSlidesFields> | CmsEntry<HeroImageFields>;
};
export type PageFields = { internalName?: string; hero?: CmsEntry<HeroFields>; blocks?: CmsEntry<unknown>[] };
