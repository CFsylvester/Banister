/** Prefix a root-relative public path ("/assets/x.png") with the deploy basePath ("/Banister" on GitHub Pages). */
export const asset = (src: string) => (src.startsWith("/") ? (process.env.NEXT_PUBLIC_BASE_PATH ?? "") + src : src);
