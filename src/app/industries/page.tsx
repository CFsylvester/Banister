import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/PageHero";
// Testimonials are hidden until approved quotes are ready — restore with the <Quotes> block below.
// import Quotes from "@/components/Quotes";
import { Img } from "@/components/ui";
import { industries /* , quotes */ } from "@/lib/content";

export const metadata: Metadata = pageMetadata({
  title: "Executive Search by Industry | Banister International",
  description: "Executive search across twelve industries, from aerospace and defense, financial services and private equity to manufacturing and technology.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <>
      <PageHero img="/assets/industries-hero.jpg" title="Industries"
        lede="Banister has delivered exceptional talent across twelve industries. Our partners have spent their careers inside these sectors — they know the people, and the people know them." />
      <section className="site px-gutter py-[clamp(56px,7vw,88px)]">
        <h2 className="m-0 mb-4 text-[clamp(26px,2.4vw,32px)] font-bold text-navy">Industries served</h2>
        {/* [Design Choice, pending owner approval 2026-11-13] SEO copy so the page says what it does in words a buyer
            searches for. Each claim is already on the site: twelve industries (the hero lede and the grid), the
            level range (Services, "Executive search"), finance, accounting and legal leadership (About, partner bios). */}
        <p className="m-0 mb-9 max-w-[760px] text-[16px] leading-[1.75] text-pretty">
          We lead executive searches across these twelve industries, from Senior Director to C-suite and board level,
          including finance and accounting leaders and general counsel and legal leadership.
        </p>
        <div className="grid grid-cols-2 gap-[clamp(12px,3vw,44px)] md:grid-cols-3 lg:auto-rows-fr lg:grid-cols-4">
          {industries.map((i) => (
            <div key={i.name} className="flex min-h-[clamp(190px,20vw,264px)] flex-col items-center justify-center gap-3 border-[3px] border-gold px-3 py-6 text-center transition-colors hover:bg-mist">
              <Img src={i.icon} className="size-[clamp(88px,11vw,150px)] object-contain" />
              <span className="text-[clamp(14px,1.35vw,18px)] leading-[1.35] font-semibold text-navy">{i.name}</span>
            </div>
          ))}
        </div>
      </section>
      {/* <Quotes heading="What our clients are saying" quotes={quotes} fadeMs={300} /> */}
    </>
  );
}
