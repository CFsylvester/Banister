import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Quotes from "@/components/Quotes";
import { Img } from "@/components/ui";
import { industries, quotes } from "@/lib/content";

export const metadata: Metadata = { title: "Industries — Banister International" };

export default function IndustriesPage() {
  return (
    <>
      <PageHero img="/assets/industries-hero.jpg" title="Industries"
        lede="Banister has delivered exceptional talent across twelve industries. Our partners have spent their careers inside these sectors — they know the people, and the people know them." />
      <section className="site px-gutter py-[clamp(56px,7vw,88px)]">
        <h2 className="m-0 mb-7 text-[clamp(26px,2.4vw,32px)] font-bold text-navy">Industries served</h2>
        <div className="grid grid-cols-2 gap-[clamp(12px,3vw,44px)] md:grid-cols-3 lg:auto-rows-fr lg:grid-cols-4">
          {industries.map((i) => (
            <div key={i.name} className="flex min-h-[clamp(190px,20vw,264px)] flex-col items-center justify-center gap-3 border-[3px] border-gold px-3 py-6 text-center transition-colors hover:bg-mist">
              <Img src={i.icon} className="size-[clamp(88px,11vw,150px)] object-contain" />
              <span className="text-[clamp(14px,1.35vw,18px)] leading-[1.35] font-semibold text-navy">{i.name}</span>
            </div>
          ))}
        </div>
      </section>
      <Quotes heading="What our clients are saying" quotes={quotes} fadeMs={300} />
    </>
  );
}
