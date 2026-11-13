import { notFound } from "next/navigation";

// The /insights listing is hidden while there is only one insight — the homepage card links straight to it.
// /insights 404s (notFound() also adds noindex) until this is restored. To bring it back: restore the page below,
// add { href: "/insights", label: "Insights" } back to `nav` and the /insights links to `siteMap` in
// src/lib/content.ts, and "insights" back to SITE_ROUTES in src/lib/cms/routes.ts.
export default function InsightsPage() {
  notFound();
}

// import type { Metadata } from "next";
// import InsightGrid, { insightsHeading, NewsGrid } from "@/components/InsightGrid";
// import { insights } from "@/config/insights";
//
// export const metadata: Metadata = { title: "Insights — Banister International" };
//
// export default function InsightsPage() {
//   return (
//     <>
//       <section className="site px-gutter pt-[clamp(48px,6vw,72px)]">
//         <h1 className="m-0 mb-8 text-[clamp(32px,3.4vw,44px)] font-bold text-navy">{insightsHeading("Latest", insights.length)}</h1>
//         <InsightGrid items={insights} />
//       </section>
//       <section className="site px-gutter py-[clamp(64px,7vw,96px)]">
//         <h2 className="m-0 mb-8 border-t border-rule pt-10 text-[clamp(28px,2.8vw,38px)] font-bold text-navy">Newsroom</h2>
//         <NewsGrid />
//       </section>
//     </>
//   );
// }
