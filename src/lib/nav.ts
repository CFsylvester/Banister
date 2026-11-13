// Main navigation. Its own module because the client SiteHeader imports it: importing it from content.ts put every
// page's copy (the leadership bios included) into the browser bundle.
export const nav = [
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/about", label: "About" },
  // { href: "/insights", label: "Insights" }, — hidden with the /insights listing (src/app/insights/page.tsx)
  { href: "/contact", label: "Contact" },
];
