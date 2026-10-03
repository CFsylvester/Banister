/** Prefix a root-relative public path with a basePath if one is ever set (none on Vercel); absolute URLs pass through. */
export const asset = (src: string) => (src.startsWith("/") ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + src : src);
