// Redirects from the old WordPress site (banisterintus.com on WP Engine) to this one, so links from search
// results, LinkedIn and email keep working after the domain moves to Vercel. Built from a crawl of the live site's
// sitemaps and internal links on 2026-11-13 (specs/003-wp-redirects/audit.md). Sources are written without the
// trailing slash and match the old site's /slug/ form in one hop; a slash-less /slug takes two (`trailingSlash: true`
// adds the slash first). Checked against `next start`, see the audit.
//
// Permanent (308) by default. `permanent: false` (307) marks a stand-in target we expect to change: a 308 is cached
// "forever" by browsers and search engines (redirects.md), so repointing it later wouldn't reach them.
//
// Not redirected, on purpose: /privacy/ and /terms-and-conditions/ keep their URLs on the new site. These 404 once
// WordPress is gone: /locations.kml, RSS feeds, other /category/ and /author/ URLs, theme images under
// /wp-content/uploads/, and WordPress internals (/wp-json, /xmlrpc.php, /wp-admin). ?p=<id> shortlinks land on the
// homepage (redirects match the path, and / is a page).

// ARTICLE_HREF from src/lib/content.ts (redirects.test.ts checks), kept literal so next.config.ts can load this file.
// Page destinations end in "/" so `trailingSlash: true` doesn't add a second redirect hop.
const ARTICLE = "/insights/state-of-talent-acquisition/";

export type LegacyRedirect = { source: string; destination: string; permanent?: boolean };

export const legacyRedirects: LegacyRedirect[] = [
  // Pages
  { source: "/our-services", destination: "/services/" },
  { source: "/about-banister-international", destination: "/about/" },
  { source: "/meet-the-team", destination: "/about/" }, // unlinked draft on the old site; leadership bios live on /about
  { source: "/our-clients", destination: "/industries/" },
  { source: "/clients", destination: "/industries/" }, // empty 2019 page on the old site
  { source: "/contact-us", destination: "/contact/" },
  { source: "/employers", destination: "/contact/?aud=employer" },
  { source: "/candidates", destination: "/contact/?aud=candidate" },
  // The old blog. /insights is hidden while there is one insight (src/app/insights/page.tsx), so the listing goes to the
  // article for now (307); point these at /insights/ and make them permanent when the listing comes back.
  { source: "/news", destination: ARTICLE, permanent: false },
  { source: "/news/page/:page", destination: ARTICLE, permanent: false },
  { source: "/category/uncategorized", destination: ARTICLE, permanent: false }, // WordPress post archive
  { source: "/author/wpsiteplan", destination: "/" }, // the WordPress agency's author page
  // The white paper's "DOWNLOAD FULL REPORT" link; same file (782,067 bytes) as public/reports/.
  {
    source: "/wp-content/uploads/2026/10/The-State-of-TA-in-Professional-Services_Banister-International-1.pdf",
    destination: "/reports/the-state-of-talent-acquisition-in-professional-services.pdf",
  },
  { source: "/the-state-of-talent-acquisition-in-professional-services", destination: ARTICLE },
  // Not on the new site yet (src/config/insights.ts has it with live: false). Point it at its own URL, permanently,
  // once it ships.
  { source: "/why-is-hr-the-cobblers-children-in-the-world-of-talent-acquisition", destination: ARTICLE, permanent: false },
  // Press releases about services; the new site covers these capabilities on /services.
  { source: "/banister-international-expands-service-offerings-through-strategic-alliance-with-duffy-group", destination: "/services/" },
  { source: "/banister-international-launches-strategic-partnership-with-shapiro-legal-search-to-introduce-legal-executive-search-capabilities", destination: "/services/" },
  { source: "/banister-international-completes-transformational-general-manager-search-project", destination: "/services/" },
  // Announcement of the firm's next phase (family ownership, new website). Not in the old sitemaps and already a 404 on
  // WordPress by 2026-11-13, but Sanford Rose Associates' copy of the release links here
  // (https://sanfordrose.com/banister-international-announces-next-phase-of-growth/), so it keeps that inbound link.
  // About is the nearest page: the firm's story and leadership.
  { source: "/banister-international-announces-next-phase-of-growth", destination: "/about/" },
];
