import type { Metadata } from "next";
import { Img, OutlineCta } from "@/components/ui";
import { related } from "@/lib/content";

export const metadata: Metadata = { title: "The state of talent acquisition in professional services — Banister International" };

export default function ArticlePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#0d1c24]">
        <Img src="/assets/article-hero.jpg" className="absolute inset-0 h-full w-full object-cover object-[left_center]" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,.2) 0%,rgba(0,0,0,.88) 38%)" }} />
        <div className="site px-gutter relative flex justify-end py-[clamp(64px,8vw,112px)]">
          <div className="flex max-w-[560px] flex-col gap-4">
            <span className="text-[13px] font-semibold tracking-[.04em] text-teal">White Paper  |  September 2026</span>
            <h1 className="m-0 text-[clamp(34px,4vw,54px)] leading-[1.1] font-bold tracking-[-.01em] text-pretty text-white">
              The state of talent acquisition in professional services
            </h1>
          </div>
        </div>
      </section>
      <section className="site px-gutter flex flex-wrap items-start gap-x-[72px] gap-y-12 pt-[clamp(48px,6vw,72px)] pb-[clamp(64px,7vw,96px)]">
        <article className="flex max-w-[720px] flex-[1_1_520px] flex-col gap-[22px]">
          <p className="m-0 text-[22px] leading-[1.45] font-bold text-navy">[Dek — one sentence summarizing the paper’s central finding.]</p>
          <span className="text-[14px] text-slate">By [Author Name] and [Author Name]</span>
          <p className="m-0 text-[17px] leading-[1.8]">[Body copy — awaiting the final manuscript.]</p>
          <p className="m-0 text-[17px] leading-[1.8]">[Body copy continues.]</p>
          <blockquote className="mx-0 my-3 bg-gold p-[clamp(24px,3vw,36px)] text-[clamp(20px,2vw,24px)] leading-[1.45] font-semibold text-navy">
            [Pull quote — the single most quotable line from the paper.]
          </blockquote>
          <p className="m-0 text-[17px] leading-[1.8]">[Body copy continues.]</p>
          <OutlineCta className="mt-2 px-[18px] py-3">DOWNLOAD THE FULL WHITE PAPER</OutlineCta>
          <p className="mx-0 mt-3 mb-0 border-t border-rule pt-5 text-[14.5px] leading-[1.65] text-teal-deep">[Author bios — one sentence each.]</p>
        </article>
        <aside className="flex flex-[0_1_300px] flex-col gap-[2px]">
          <div className="bg-fog p-6">
            <div className="mb-3 text-[16px] font-bold text-navy">Related reading</div>
            {related.map((r) => (
              <div key={r.title} className="flex flex-col gap-1 border-t border-[#d3d8dc] py-3">
                <span className="text-[12.5px] text-slate">{r.date}</span>
                <span className="text-[14.5px] leading-[1.45] font-semibold text-navy">{r.title}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#d8dde3] p-6">
            <div className="mb-2 text-[16px] font-bold text-navy">Also of interest</div>
            <span className="text-[14.5px] leading-[1.5]">Explore our latest <a href="#">case studies</a> in manufacturing.</span>
          </div>
        </aside>
      </section>
    </>
  );
}
