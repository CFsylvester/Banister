// Page slugs the static site builds today ("home" = /). Internal buttons may only link to these — a link to any
// other page would ship a 404 (checked in map/hero.ts). Extend when pages render from Contentful by slug.
export const SITE_ROUTES: ReadonlySet<string> = new Set(["home", "services", "industries", "about", "insights", "contact"]);
