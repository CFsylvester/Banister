import type { NextConfig } from "next";

// Hosted on Vercel (Node runtime), not a static export: Contentful publishes refresh pages on demand
// (specs/002-vercel-publishing). Docs: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/
// cacheComponents.md, 04-functions/cacheTag.md, 04-functions/revalidateTag.md.
const nextConfig: NextConfig = {
  // Enables `'use cache'` + cacheTag/cacheLife — how CMS reads are cached and invalidated on publish.
  cacheComponents: true,
  // CMS reads (src/lib/cms/source.ts): publishes invalidate them immediately via revalidateTag; this hourly
  // background refresh is only a safety net for a missed or raced webhook (cacheLife.md, "Custom cache profiles").
  cacheLife: {
    cms: { stale: 300, revalidate: 60 * 60, expire: 60 * 60 * 24 * 365 },
  },
  // Keep the /about/ style URLs the site already uses. This makes /api/revalidate 308 to /api/revalidate/, so the
  // Contentful webhook must call the trailing-slash URL (scripts/cms/webhook.mjs enforces it).
  trailingSlash: true,
  // CONTENT_SOURCE=fixture reads these at runtime (e.g. on a Vercel preview), so ship them with the server
  // (05-config/01-next-config-js/output.md, "outputFileTracingIncludes").
  outputFileTracingIncludes: { "/*": ["./contentful/seed/**/*", "./design/assets/**/*"] },
};

export default nextConfig;
