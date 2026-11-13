import type { MetadataRoute } from "next";
import { absUrl } from "@/lib/seo";

// Every indexable page. Add a route here when it ships; /insights/ stays out while the listing 404s
// (src/app/insights/page.tsx). `lastModified` is omitted rather than faked: Google uses it only when it is
// "consistently and verifiably accurate" (https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
const ROUTES = ["/", "/services", "/industries", "/about", "/contact", "/insights/state-of-talent-acquisition", "/privacy", "/terms-and-conditions"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((path) => ({ url: absUrl(path) }));
}
