import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
// Testimonials are hidden until approved quotes are ready — restore with the <Quotes> block below.
// import Quotes from "@/components/Quotes";
import { Icon } from "@/components/ui";
import { industries /* , quotes */ } from "@/lib/content";

export const metadata: Metadata = { title: "Industries — Banister International" };

export default function IndustriesPage() {
  return (
    <>
      <PageHero img="/assets/industries-hero.jpg" title="Industries"
        lede="Banister has delivered exceptional talent across eleven industries. Our partners have spent their careers inside these sectors — they know the people, and the people know them." />
      <section className="site px-gutter py-[clamp(56px,7vw,88px)]">
        <h2 className="m-0 mb-7 text-[clamp(26px,2.4vw,32px)] font-bold text-navy">Industries served</h2>
        <div className="grid grid-cols-2 gap-x-[clamp(12px,3vw,44px)] auto-rows-fr gap-y-[clamp(12px,1.4vw,20px)] md:grid-cols-3 lg:grid-cols-4">
          {industries.map((i) => (
            <div key={i.icon} className="flex min-h-[clamp(150px,22vw,220px)] flex-col items-center border-[3px] border-gold px-1 pt-[clamp(8px,0.8vw,12px)] pb-2 lg:aspect-square lg:min-h-0 lg:pb-0 text-center transition-colors hover:bg-mist">
              <Icon src={i.icon} className="size-[clamp(88px,11vw,150px)] object-contain" />
              <span className="text-[clamp(14px,1.3vw,20px)] leading-[1.25] font-semibold whitespace-pre-line text-navy">{i.name}</span>
            </div>
          ))}
        </div>
      </section>
      {/* <Quotes heading="What our clients are saying" quotes={quotes} fadeMs={300} /> */}
    </>
  );
}
