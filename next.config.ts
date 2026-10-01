import type { NextConfig } from "next";

// Hosted on Vercel (Node runtime), not a static export: Contentful publishes refresh pages on demand
// (specs/002-vercel-publishing). Docs: node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/
// cacheComponents.md, 04-functions/cacheTag.md, 04-functions/revalidateTag.md.
const nextConfig: NextConfig = {
  // Enables `'use cache'` + cacheTag/cacheLife — how CMS reads are cached and invalidated on publish.
  cacheComponents: true,
  // CMS reads (src/lib/cms/source.ts): publishes invalidate them immediately via revalidateTag; the hourly
  // background refresh (first request after the hour still gets the old copy) is only a safety net for a missed webhook (cacheLife.md, "Custom cache profiles").
  cacheLife: {
    cms: { stale: 300, revalidate: 60 * 60, expire: 60 * 60 * 24 * 365 },
  },
  // Keep the /about/ style URLs the site already uses. This makes /api/revalidate 308 to /api/revalidate/, so the
  // Contentful webhook must call the trailing-slash URL (scripts/cms/webhook.mjs enforces it).
  trailingSlash: true,
  // CONTENT_SOURCE=fixture reads these at runtime (e.g. a Vercel preview without CMS keys), so ship them with the
  // server — only for fixture builds; Contentful builds don't need them (output.md, "outputFileTracingIncludes").
  ...(process.env.CONTENT_SOURCE === "fixture"
    ? { outputFileTracingIncludes: { "/*": ["./contentful/seed/**/*", "./design/assets/**/*"] } }
    : {}),
};

export default nextConfig;
