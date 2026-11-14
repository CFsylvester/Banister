import type { Metadata } from "next";
import { isBlank, LEGAL } from "./legal.ts";

// The production origin. The live site's canonical is https://banisterintus.com/ (checked 2026-11-13); set
// NEXT_PUBLIC_SITE_URL only if the new site launches on a different host. Canonicals, Open Graph URLs, the sitemap and
// JSON-LD all build from this, so previews still point search engines at production.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://banisterintus.com").replace(/\/$/, "");
export const SITE_NAME = "Banister International";
export const LINKEDIN_URL = "https://www.linkedin.com/company/banisterinternational/home/";

/** Absolute URL with the trailing slash the site serves (next.config.ts `trailingSlash: true`). */
export const absUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : `/${path.replace(/^\/|\/$/g, "")}/`}`;

// The root app/opengraph-image.tsx route, at the trailing-slash URL the site serves.
export const DEFAULT_OG = { url: "/opengraph-image/", width: 1200, height: 630, alt: "Banister International" };

/**
 * Full per-page metadata. Next merges `openGraph` shallowly — a page that sets any `openGraph` field replaces the
 * layout's whole object (generate-metadata.md, "Merging") — so every page gets the complete set from here instead of
 * relying on inheritance. That includes the image: a page's own `openGraph` drops the root app/opengraph-image, and an
 * explicit `images` here beats a route's own opengraph-image file (both seen in `next build` output, Next 16.3.7,
 * 2026-11-13 — the second contradicts generate-metadata.md, "File-based metadata has the higher priority") — so a route
 * with its own card passes it as `image`.
 */
export function pageMetadata({ title, description, path, type = "website", image = DEFAULT_OG }: {
  /** Shown as-is: include the brand. */
  title: string;
  /** ≤ 155 characters so Google doesn't truncate it. */
  description: string;
  /** Route path, e.g. "/services". */
  path: string;
  type?: "website" | "article";
  /** Social card; defaults to the root opengraph-image. */
  image?: { url: string; width: number; height: number; alt: string };
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: absUrl(path) },
    openGraph: { type, url: absUrl(path), siteName: SITE_NAME, title, description, locale: "en_US", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** /contact/ and its outside-US copy (served at the same URL by src/proxy.ts) share one set of tags. */
export const CONTACT_META = {
  title: "Contact an Executive Search Partner | Banister International",
  description: "Hiring a senior leader, or exploring your next role? Tell us about it and a Banister International partner will respond personally.",
  path: "/contact",
};

const ORG_ID = `${SITE_URL}/#organization`;

/** "4422 N Ravenswood Ave, Chicago, IL 60640, United States" → PostalAddress. Returns undefined — and the JSON-LD simply
 * omits the address — for a blank (src/lib/legal.ts) or any other shape, so a reworded address can't break every page. */
export function postalAddress(raw: string) {
  const m = isBlank(raw) ? null : raw.match(/^([^,]+), ([^,]+), ([A-Z]{2}) (\d{5}(?:-\d{4})?), United States$/);
  return m ? { "@type": "PostalAddress", streetAddress: m[1], addressLocality: m[2], addressRegion: m[3], postalCode: m[4], addressCountry: "US" } : undefined;
}

/** Organization + WebSite, rendered once in the root layout. Name, email and LinkedIn are visible in the footer; the
 * phone is the footer phone link (its number is in the link's alt text); the address is on /privacy/ and
 * /terms-and-conditions/. */
export const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      // ProfessionalService is a LocalBusiness subtype (https://schema.org/ProfessionalService); EmploymentAgency was the live site's type, but it reads
      // as a staffing agency, which a retained executive search firm is not.
      "@type": ["Organization", "ProfessionalService"],
      "@id": ORG_ID,
      name: SITE_NAME,
      // schema.org legalName: "The official name of the organization" (https://schema.org/legalName). The LLC on the EIN
      // (src/lib/legal.ts); `name` stays the brand.
      legalName: LEGAL.entity,
      url: absUrl("/"),
      // No `logo` yet: the only logo files are white (public/assets/banister-logo-white.*), and Google shows the logo
      // on a white background. Add one when a dark logo exists.
      description: "Banister International is an executive search and human capital advisory firm, founded in 1999, that places senior leaders from Senior Director to C-suite and board level.",
      foundingDate: "1999",
      email: "info@banisterintus.com",
      telephone: "+1-224-655-5563",
      address: postalAddress(LEGAL.postalAddress),
      sameAs: [LINKEDIN_URL],
    },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: absUrl("/"), name: SITE_NAME, publisher: { "@id": ORG_ID }, inLanguage: "en-US" },
  ],
};

export const orgRef = { "@id": ORG_ID };
