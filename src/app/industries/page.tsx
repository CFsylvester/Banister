import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import { PAGE_HEROES } from "@/config/heroes";
// Testimonials are hidden until approved quotes are ready — restore with the <Quotes> block below.
// import Quotes from "@/components/Quotes";
import RevealIcon, { type HoverMotion } from "@/components/RevealIcon";
import { industries /* , quotes */ } from "@/lib/content";

// Per-icon hover motions (globals.css .reveal-icon).
const HOVER: Partial<Record<string, HoverMotion>> = {
  "/assets/icon-aerospace.svg": "fly", "/assets/icon-building-services.svg": "spin",
  "/assets/icon-consumer.svg": "roll", "/assets/icon-financial.svg": "lift",
  "/assets/icon-food.svg": "hop", "/assets/icon-industrial.svg": "drive",
  "/assets/icon-insurance.svg": "pulse", "/assets/icon-consulting.svg": "lift",
  "/assets/icon-manufacturing.svg": "nod", "/assets/icon-private-equity.svg": "flip",
  "/assets/icon-technology.svg": "wiggle",
};

export const metadata: Metadata = pageMetadata({
  title: "Executive Search by Industry | Banister International",
  description: "Executive search across eleven industries, from aerospace and defense, financial services and private equity to manufacturing and telecommunications.",
  path: "/industries",
});

export default function IndustriesPage() {
  return (
    <>
      <PageHero img={PAGE_HEROES.industries} title="Industries"
        lede="Banister has delivered exceptional talent across eleven industries. Our partners have spent their careers inside these sectors — they know the people, and the people know them." />
      <section className="site px-gutter py-[clamp(56px,7vw,88px)]">
        <h2 className="m-0 mb-4 text-[clamp(26px,2.4vw,32px)] font-bold text-navy">Industries served</h2>
        {/* [Design Choice, pending owner approval 2026-11-13] SEO copy so the page says what it does in words a buyer
            searches for. Each claim is already on the site: eleven industries (the hero lede and the grid), the
            level range (Services, "Executive search"), finance, accounting and legal leadership (About, partner bios). */}
        <p className="m-0 mb-9 max-w-[760px] text-[16px] leading-[1.75] text-pretty">
          We lead executive searches across these eleven industries, from Senior Director to C-suite and board level,
          including finance and accounting leaders and general counsel and legal leadership.
        </p>
        <div className="grid grid-cols-2 gap-x-[clamp(12px,3vw,44px)] auto-rows-fr gap-y-[clamp(12px,1.4vw,20px)] md:grid-cols-3 lg:grid-cols-4">
          {industries.map((i, n) => (
            <div key={i.icon} className="flex min-h-[clamp(150px,22vw,220px)] flex-col items-center border-[3px] border-gold px-1 pt-[clamp(8px,0.8vw,12px)] pb-2 lg:aspect-square lg:min-h-0 lg:pb-0 text-center transition-colors hover:bg-mist">
              {/* Stagger by column so each row ripples left to right as it enters (4 columns at lg). */}
              <RevealIcon src={i.icon} hover={HOVER[i.icon]} delayMs={(n % 4) * 90}
                className="size-[clamp(88px,11vw,150px)]" />
              <span className="text-[clamp(14px,1.3vw,20px)] leading-[1.25] font-semibold whitespace-pre-line text-navy">{i.name}</span>
            </div>
          ))}
        </div>
      </section>
      {/* <Quotes heading="What our clients are saying" quotes={quotes} fadeMs={300} /> */}
    </>
  );
}
