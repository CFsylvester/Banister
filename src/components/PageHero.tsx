import type { ReactNode } from "react";
import { NavyCta, Img } from "./ui";

/** Split hero used by Services / Industries / About: photo left, mist panel with title + intro right. */
export default function PageHero({ img, title, lede, children }: { img: string; title: string; lede: string; children?: ReactNode }) {
  return (
    <section className="flex flex-wrap items-stretch">
      <Img src={img} className="block aspect-[6/5] max-h-[620px] w-full min-w-0 flex-[1_1_420px] object-cover" />
      <div className="flex flex-[1.35_1_380px] flex-col justify-center gap-[18px] bg-mist pt-[clamp(40px,6vw,88px)] pr-[clamp(20px,5vw,80px)] pb-[clamp(40px,6vw,88px)] pl-[clamp(20px,4.4vw,64px)]">
        <div className="flex max-w-[620px] flex-col gap-[18px]">
          <span className="h-1 w-14 bg-teal" />
          <h1 className="m-0 text-[clamp(36px,4vw,52px)] leading-[1.1] font-bold tracking-[-.01em] text-navy">{title}</h1>
          <p className="m-0 text-[18px] leading-[1.65] text-pretty text-navy">{lede}</p>
          {children}
          <div className="mt-3.5 flex flex-wrap items-center gap-x-7 gap-y-4">
            <NavyCta href="/contact">SPEAK WITH A PARTNER</NavyCta>
          </div>
        </div>
      </div>
    </section>
  );
}
