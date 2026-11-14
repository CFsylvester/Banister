import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import { PAGE_HEROES } from "@/config/heroes";
import Reveal from "@/components/Reveal";
import type { HoverMotion } from "@/components/RevealIcon";
import { Arrow, Icon } from "@/components/ui";
import { drivers, services } from "@/lib/content";
import { GRID_4 } from "@/lib/grid";

// Per-driver hover motions (globals.css [data-hover] rules, triggered by .driver-card:hover): the award sways, the gear turns, the stopwatch dashes, the bulb lights.
const DRIVER_HOVER: Partial<Record<string, HoverMotion>> = {
  Quality: "sway", Execution: "spin", Speed: "dash", Insights: "glow",
};

export const metadata: Metadata = pageMetadata({
  title: "Executive Search Services | Banister International",
  description: "Executive search from Senior Director to C-suite and board, next-generation leadership search, and search and advisory projects, each led by a partner.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <PageHero img={PAGE_HEROES.services} title="Services"
        lede="Four ways to engage Banister — from a single C-suite appointment to a full hiring program. Each is led by one partner, and each tells your organization’s story to the people you want to reach." />

      <section className="site px-gutter py-[clamp(56px,7vw,88px)]">
        <div className="grid gap-5" style={{ gridTemplateColumns: GRID_4(20, 600) }}>
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
          {/* A named container so the entrance stagger can follow GRID_4's 4-up → 2-up switch (globals.css .driver). */}
          <div className="@container/drivers grid gap-x-7 gap-y-10" style={{ gridTemplateColumns: GRID_4(28) }}>
            {drivers.map((d, i) => (
              <div key={d.title} className="driver-card flex flex-col items-center gap-3.5 text-center">
                {/* Percentages are the hex's 750-unit canvas (the inline <svg> below): hex centre (375,357), left vertex (59,357).
                    The left margin (a % of this capped wrapper, not the grid cell) makes room for the number circle that hangs off that vertex. */}
                <div className="w-full max-w-[240px]">
                  {/* Enters in order 1 → 4: hex rises, icon fades in, gold chevron slides in as the underline draws, number
                      pops (globals.css .driver). */}
                  <Reveal className="driver relative ml-[8.19%] @container"
                    style={{ "--delay-4up": `${i * 280}ms`, "--delay-2up": `${(i % 2) * 280}ms` } as CSSProperties}>
                    {/* Inline rather than an <img> so each part can animate on its own. pathLength={1} lets the underline
                        draw with one dash value regardless of its real length. */}
                    <svg viewBox="0 0 750 750" aria-hidden="true" className="block h-auto w-full overflow-visible">
                      <polygon className="driver-hex" fill="#003F5E" points="216.5,83.5 533.5,83.5 691.5,357 533.5,631 216.5,631 59,357" />
                      <polygon className="driver-chevron" fill="#FFC91E" points="628,172.5 735,357.5 628,542.5 628,480 699,357.5 628,235" />
                      <path className="driver-line" pathLength={1} fill="none" stroke="#FFC91E" strokeWidth="8" strokeMiterlimit="10" d="M17 381 L188.5 676.5 L534 676.5" />
                    </svg>
                    {/* The entrance runs on the span and the hover motion on the img, so ending a hover can't replay it. */}
                    <span className="driver-icon absolute top-[17%] left-[20.67%] w-[58.67%]">
                      <Icon src={d.icon} data-hover={DRIVER_HOVER[d.title]} className="block w-full" />
                    </span>
                    <span aria-hidden="true" className="driver-num absolute top-[32.53%] left-[-8.92%] flex aspect-square w-[30.13%] items-center justify-center rounded-full border-[0.9cqw] border-white bg-teal text-[16.5cqw] leading-none font-extrabold text-navy">
                      {i + 1}
                    </span>
                  </Reveal>
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
