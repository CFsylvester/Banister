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
  // next/image (src/components/ui.tsx Img). Options from node_modules/next/dist/docs/01-app/03-api-reference/
  // 02-components/image.md: `formats` defaults to WebP only, so AVIF is listed first for browsers that accept it;
  // `remotePatterns` lets live-mode hero images (asset URLs from Contentful, src/lib/cms/normalize.ts — served from
  // images.ctfassets.net [unverified]) through the optimizer, scoped to this space's path. Builds without a space ID
  // (fixture mode serves /cms/... locally) allow no remote host, so the optimizer can't be used for other spaces.
  // The default `qualities` ([75]) and sizes are kept (node_modules/next/dist/shared/lib/image-config.js).
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: process.env.CONTENTFUL_SPACE_ID ? [new URL(`https://images.ctfassets.net/${process.env.CONTENTFUL_SPACE_ID}/**`)] : [],
  },
  // Baseline security headers (report item D14), values from
  // node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/headers.md. HSTS leaves out
  // includeSubDomains because other banisterintus.com hosts (mail, the old WordPress site) aren't known to be HTTPS-only
  // [unverified]. No full Content-Security-Policy yet: the pages use inline styles and Contentful images, so a policy
  // needs its own testing (01-app/02-guides/content-security-policy.md); frame-ancestors alone is safe now.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
        ],
      },
    ];
  },
  // CONTENT_SOURCE=fixture reads these at runtime (e.g. a Vercel preview without CMS keys), so ship them with the
  // server — only for fixture builds; Contentful builds don't need them (output.md, "outputFileTracingIncludes").
  ...(process.env.CONTENT_SOURCE === "fixture"
    ? { outputFileTracingIncludes: { "/*": ["./contentful/seed/**/*", "./design/assets/**/*"] } }
    : {}),
};

export default nextConfig;
