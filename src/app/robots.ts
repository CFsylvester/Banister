import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

// One `*` group: every search and AI-answer crawler (Googlebot, bingbot, OAI-SearchBot, Claude-SearchBot, PerplexityBot)
// falls through to it. A bot given its own group would lose these disallows (RFC 9309 §2.2.1), so don't add one without
// repeating them. AI *training* crawlers are allowed too [Design Choice, pending owner confirmation 2026-11-13]: block
// them with a separate `disallow: "/"` group (agents-kit geo skill, references/ai-crawlers.md §2) if Banister decides to.
// /contact/outside-us/ is NOT disallowed: it carries noindex, and a crawler has to fetch the page to see that.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
