# Old WordPress site → new site: URL audit and redirects

The old site (banisterintus.com) ran WordPress on WP Engine, with DNS at Cloudflare. Now that the domain points at Vercel (since 2026-11-13),
every URL people and search engines already know has to land somewhere useful. This file records which URLs exist and
where each goes. The map itself is `src/config/redirects.ts`; `next.config.ts` serves it as permanent (308) redirects, except stand-in targets we expect to change, which are temporary (307) so browsers and search engines don't cache them forever.

## How the URLs were found

Crawled 2026-11-13 from one US connection, following `robots.txt` (`Crawl-delay: 10`, `Disallow: /wp-admin/`).
Script: start from `/sitemap_index.xml` (which lists `post-`, `page-` and `local-sitemap.xml`), plus a set of standard
WordPress URLs (`/feed/`, `/category/uncategorized/`, `/author/admin/`, `/?p=1`, `/sample-page/`, `/wp-json/`,
`/xmlrpc.php`, …), then follow every same-host link on each HTML page. Theme and plugin assets were not followed.
All 20 HTML pages found were visited; the crawl was stopped with WordPress API (`/wp-json/…`) and image URLs still queued.

Live DNS at the time: nameservers `joaquin`/`paloma.ns.cloudflare.com`; apex and `www` both CNAME
`kkrwswlah74s.wpeproxy.com` (WP Engine), **DNS only** in Cloudflare (the apex CNAME is flattened, so `dig` shows A
`141.193.213.20`/`.21`); MX `banisterintus-com.mail.protection.outlook.com`. The `server: cloudflare` header came from
WP Engine's own Cloudflare edge (Cloudflare for SaaS, hence the two `_cf-custom-hostname` TXT records), not from
Banister's zone: a proxied record would answer with Cloudflare anycast IPs, not WP Engine's
(https://developers.cloudflare.com/dns/proxy-status/). An earlier version of this note called the records proxied.

## Cutover (2026-11-13)

Both CNAMEs now point at `c873f576d3d37ebf.vercel-dns-016.com` (the target Vercel → Settings → Domains showed), still
DNS only, as Vercel recommends for Cloudflare (https://vercel.com/docs/domains/troubleshooting). `www` 308-redirects to
the apex in Vercel. Checked the same day: `server: Vercel`; Let's Encrypt certificates for both names; `http://` and
`www` 308 to `https://banisterintus.com/`; every old URL in the map below reaches its target; `banister.cc` and
`banisterinternational.com` (redirects to the apex in their own Cloudflare zones) land on the new site; MX and SPF
unchanged. Rollback: point both CNAMEs back at `kkrwswlah74s.wpeproxy.com` (TTL 300 s).

After WP Engine is cancelled, delete the two `_cf-custom-hostname` TXT records; they only existed for WP Engine's
custom hostname (https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/domain-support/hostname-validation/pre-validation/).
Keep the `google-site-verification` TXT record: it verifies the Search Console Domain property (sitemap submitted
2026-11-13).

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
