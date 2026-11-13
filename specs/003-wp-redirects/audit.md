# Old WordPress site → new site: URL audit and redirects

The live site (banisterintus.com) runs WordPress on WP Engine behind Cloudflare. When the domain points at Vercel,
every URL people and search engines already know has to land somewhere useful. This file records which URLs exist and
where each goes. The map itself is `src/config/redirects.ts`; `next.config.ts` serves it as permanent (308) redirects, except stand-in targets we expect to change, which are temporary (307) so browsers and search engines don't cache them forever.

## How the URLs were found

Crawled 2026-11-13 from one US connection, following `robots.txt` (`Crawl-delay: 10`, `Disallow: /wp-admin/`).
Script: start from `/sitemap_index.xml` (which lists `post-`, `page-` and `local-sitemap.xml`), plus a set of standard
WordPress URLs (`/feed/`, `/category/uncategorized/`, `/author/admin/`, `/?p=1`, `/sample-page/`, `/wp-json/`,
`/xmlrpc.php`, …), then follow every same-host link on each HTML page. Theme and plugin assets were not followed.
All 20 HTML pages found were visited; the crawl was stopped with WordPress API (`/wp-json/…`) and image URLs still queued.

Live DNS at the time: nameservers `joaquin`/`paloma.ns.cloudflare.com`; apex A `141.193.213.20`/`.21` and
`www` CNAME `kkrwswlah74s.wpeproxy.com` (WP Engine), proxied by Cloudflare (`server: cloudflare`,
`x-powered-by: WP Engine`); MX `banisterintus-com.mail.protection.outlook.com`.

## Map

| Old URL (live status) | New URL | Why |
|---|---|---|
| `/our-services/` (200) | `/services/` | Same page |
| `/about-banister-international/` (200) | `/about/` | Same page |
| `/meet-the-team/` (200, unlinked draft) | `/about/` | Leadership bios are on /about |
| `/our-clients/` (200) | `/industries/` | Closest page; the new site lists industries, not client names |
| `/clients/` (200, empty 2019 page) | `/industries/` | Same as above |
| `/contact-us/` (200) | `/contact/` | Same page |
| `/employers/` (200) | `/contact/?aud=employer` | Opens the employer tab |
| `/candidates/` (200, unlinked draft) | `/contact/?aud=candidate` | Opens the candidate tab |
| `/news/`, `/news/page/2/` (200) | `/insights/state-of-talent-acquisition/` (307) | `/insights/` is hidden (404) while there is one insight |
| `/category/uncategorized/` (200) | `/insights/state-of-talent-acquisition/` (307) | Post archive |
| `/author/wpsiteplan/` (200) | `/` | The WordPress agency's author page |
| `/the-state-of-talent-acquisition-in-professional-services/` (200) | `/insights/state-of-talent-acquisition/` | Same article |
| `/why-is-hr-the-cobblers-children-in-the-world-of-talent-acquisition/` (200) | `/insights/state-of-talent-acquisition/` (307) | Not on the new site yet (`live: false` in `src/config/insights.ts`); repoint when it ships |
| `/banister-international-expands-service-offerings-through-strategic-alliance-with-duffy-group/` (200) | `/services/` | Press release about services |
| `/banister-international-launches-strategic-partnership-with-shapiro-legal-search-to-introduce-legal-executive-search-capabilities/` (200) | `/services/` | Press release about services |
| `/banister-international-completes-transformational-general-manager-search-project/` (200) | `/services/` | Press release about a search project |
| `/wp-content/uploads/2026/10/The-State-of-TA-in-Professional-Services_Banister-International-1.pdf` (200, 782,067 bytes) | `/reports/the-state-of-talent-acquisition-in-professional-services.pdf` | Same file (same size) |
| `/privacy/`, `/terms-and-conditions/` (200) | unchanged | Same URLs on the new site |
| `/` (200) | unchanged | |

**Left to 404 on purpose:** `/locations.kml` (empty address and phone), RSS feeds (`/feed/`, `/comments/feed/`,
`/news/feed/`, `/category/uncategorized/feed/`), other `/category/` and `/author/` URLs, images under
`/wp-content/uploads/`, and WordPress internals (`/wp-json/…`, `/xmlrpc.php`, `/wp-admin/`). `/blog/` and
`/author/admin/` already 404 on the live site. `?p=<id>` shortlinks (WordPress 301s them to the slugs above) land on
the new homepage, because redirects match the path and `/` is a page.

## Choices to confirm with Banister

- `/news/` and the blog posts point at the one live article, and the three press releases at `/services/`. If the
  `/insights/` listing comes back, point `/news/`, `/news/page/:page` and `/category/uncategorized` there and drop
  `permanent: false`.
- The cobbler's-children article should be repointed to its own URL, permanently, once it is published here.

## Verified against the built site

`CONTENT_SOURCE=fixture pnpm build && next start`, then `curl -L` on each old URL (2026-11-13):

- Every URL in the map returns 200 after **one** hop (308, or 307 where marked), at the new URL in the table.
- Query strings carry through: `/employers/?utm_source=linkedin` → `/contact/?utm_source=linkedin&aud=employer`.
- A slash-less old URL (`/our-services`) takes two hops (`trailingSlash: true` adds the slash first) and still lands.
- `/privacy/`, `/terms-and-conditions/` 200 with no redirect; `/feed/`, `/locations.kml` 404.

`src/config/redirects.test.ts` keeps the map honest: every destination is a page or `public/` file the site serves,
none is the hidden `/insights/`, no source shadows a page, route handler or `public/` file, no destination chains
into another redirect, and page destinations end in `/` so there is no second hop.
