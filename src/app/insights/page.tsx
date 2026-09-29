import type { Metadata } from "next";
import InsightGrid, { NewsGrid } from "@/components/InsightGrid";
import { insights } from "@/lib/content";

export const metadata: Metadata = { title: "Insights — Banister International" };

export default function InsightsPage() {
  return (
    <>
      <section className="site px-gutter pt-[clamp(48px,6vw,72px)]">
        <h1 className="m-0 mb-8 text-[clamp(32px,3.4vw,44px)] font-bold text-navy">Latest insights</h1>
        <InsightGrid items={insights} />
      </section>
      <section className="site px-gutter py-[clamp(64px,7vw,96px)]">
        <h2 className="m-0 mb-8 border-t border-rule pt-10 text-[clamp(28px,2.8vw,38px)] font-bold text-navy">Newsroom</h2>
        <NewsGrid />
      </section>
    </>
  );
}
