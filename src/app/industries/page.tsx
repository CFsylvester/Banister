import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import Quotes from "@/components/Quotes";
import { Img } from "@/components/ui";
import { industries } from "@/lib/content";

export const metadata: Metadata = { title: "Industries — Banister International" };

export default function IndustriesPage() {
  return (
    <>
      <PageHero img="/assets/industries-laptop.jpg" title="Industries"
        lede="Banister has delivered exceptional talent across fourteen industries. Our partners have spent their careers inside these sectors — they know the people, and the people know them." />
      <section className="site px-gutter py-[clamp(56px,7vw,88px)]">
        <h2 className="m-0 mb-7 text-[clamp(26px,2.4vw,32px)] font-bold text-navy">Industries served</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,190px),1fr))] gap-4">
          {industries.map((i) => (
            <div key={i.name} className="flex min-h-[170px] flex-col items-center gap-4 border border-rule px-[18px] pt-7 pb-6 text-center hover:border-navy hover:bg-[#f7f9fa]">
              <Img src={i.icon} className="h-[52px] w-auto max-w-[90px] object-contain" />
              <span className="text-[14px] leading-[1.4] font-semibold text-navy">{i.name}</span>
            </div>
          ))}
        </div>
      </section>
      <Quotes fadeMs={300} />
    </>
  );
}
