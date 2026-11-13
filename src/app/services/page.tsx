import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import { Arrow, Icon } from "@/components/ui";
import { drivers, services } from "@/lib/content";
import { GRID_4 } from "@/lib/grid";

export const metadata: Metadata = { title: "Services — Banister International" };

export default function ServicesPage() {
  return (
    <>
      <PageHero img="/assets/services-hero.jpg" title="Services"
        lede="Four ways to engage Banister — from a single C-suite appointment to a full hiring program. Each is led by one partner, and each tells your organization’s story to the people you want to reach." />

      <section className="site px-gutter py-[clamp(56px,7vw,88px)]">
        <div className="grid gap-5" style={{ gridTemplateColumns: GRID_4(20) }}>
          {services.map((s) => (
            <div key={s.title} className="row-span-2 grid grid-rows-subgrid gap-y-0 border border-[#d3d9de]" style={{ background: s.dark ? "#003f5e" : "#fff" }}>
              <div className="flex items-center px-[22px] pt-[22px] pb-5" style={{ background: s.dark ? "#fff" : "#003f5e", color: s.dark ? "#003f5e" : "#fff" }}>
                <h2 className="m-0 text-[21px] leading-[1.25] font-bold">{s.title}</h2>
              </div>
              <div className="flex flex-col gap-3.5 p-[22px]">
                {s.paras.map((para) => (
                  <p key={para} className="m-0 text-[14.5px] leading-[1.7]" style={{ color: s.dark ? "#fff" : "#414547" }}>{para}</p>
                ))}
                {s.dark && (
                  <a href="https://duffygroup.com/our-process/" target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-2 self-start text-[12.5px] font-bold tracking-[.06em] text-white no-underline hover:text-white">
                    <span className="underline decoration-gold decoration-2 underline-offset-[6px]">ABOUT DUFFY GROUP</span><span><Arrow /></span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-fog">
        <div className="site px-gutter py-[clamp(56px,7vw,96px)]">
          <h2 className="m-0 mb-5 text-[clamp(28px,2.8vw,38px)] font-bold text-navy">Flawless search methodology</h2>
          <p className="m-0 mb-14 max-w-[760px] text-[17px] leading-[1.7] text-pretty">
            A proprietary search process that shortens the time to complete a search while significantly raising the quality and diversity of the candidates delivered. It brings <strong className="text-navy">four key drivers</strong> together to deliver talent that increases our clients’ enterprise value.
          </p>
          <div className="grid gap-x-7 gap-y-10" style={{ gridTemplateColumns: GRID_4(28) }}>
            {drivers.map((d, i) => (
              <div key={d.title} className="flex flex-col items-center gap-3.5 text-center">
                {/* Percentages are hex-base.svg's 750-unit canvas: hex centre (375,357), left vertex (59,357).
                    The left margin (a % of this capped wrapper, not the grid cell) makes room for the number circle that hangs off that vertex. */}
                <div className="w-full max-w-[240px]">
                  <div className="relative ml-[8.19%] @container">
                    {/* width/height = the SVG's 750×750 viewBox, so the lazy image holds its square before it loads. */}
                    <Icon src="/assets/hex-base.svg" width={750} height={750} className="block h-auto w-full" />
                    <Icon src={d.icon} className="absolute top-[17%] left-[20.67%] w-[58.67%]" />
                    <span aria-hidden="true" className="absolute top-[32.53%] left-[-8.92%] flex aspect-square w-[30.13%] items-center justify-center rounded-full border-[0.9cqw] border-white bg-teal text-[16.5cqw] leading-none font-extrabold text-navy">
                      {i + 1}
                    </span>
                  </div>
                </div>
                <span className="text-[21px] font-bold text-navy">{d.title}</span>
                <span className="max-w-[240px] text-[15px] leading-[1.6]">{d.body}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
