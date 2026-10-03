// One rule, shared by the render path and scripts/cms/sync-assets.mjs, for where a CMS image lives in the
// static build: public/cms/<assetId>.<ext>, served at /cms/<assetId>.<ext> (+ basePath via asset()).
// Images are downloaded at build (specs/001-contentful-cms research R7), so the built site has no runtime
// dependency on Contentful's CDN.
const EXT: Record<string, string> = {
  "image/png": ".png", "image/jpeg": ".jpg", "image/webp": ".webp", "image/gif": ".gif", "image/svg+xml": ".svg", "image/avif": ".avif",
};

export function extFor(contentType: string): string {
  const ext = EXT[contentType];
  if (!ext) throw new Error(`Unsupported image content type ${JSON.stringify(contentType)}`);
  return ext;
}

export const localAssetPath = (a: { id: string; contentType: string }) => `/cms/${a.id}${extFor(a.contentType)}`;

/** Sniff the real MIME type from magic bytes (the placeholder "*.jpg" files are actually PNG). */
export function sniffImageType(bytes: Uint8Array): string {
  const b = bytes;
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  if (b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "image/webp";
  throw new Error("Unrecognized image bytes");
}
