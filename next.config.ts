import type { NextConfig } from "next";

// Hosted on Vercel (Node runtime), not a static export: Contentful publishes refresh pages on demand
// (specs/002-vercel-publishing). Docs: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/
// cacheComponents.md, 04-functions/cacheTag.md, 04-functions/revalidateTag.md.
const nextConfig: NextConfig = {
  // Enables `'use cache'` + cacheTag/cacheLife — how CMS reads are cached and invalidated on publish.
  cacheComponents: true,
  // Keep the /about/ style URLs the site already uses.
  trailingSlash: true,
};

export default nextConfig;
