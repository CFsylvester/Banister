import Link from "next/link";
import { siteMap } from "@/lib/content";
import { Img } from "./ui";

const icon = "block h-11 w-11 cursor-pointer hover:opacity-85";

export default function SiteFooter() {
  return (
    <footer className="text-white" style={{ background: "linear-gradient(180deg,#003f5e 0%,#00415f 22%,#0d6781 60%,#2bc1c6 100%)" }}>
      <div className="site px-gutter flex flex-col gap-[clamp(28px,3.6vw,44px)] pt-[clamp(36px,4.4vw,56px)] pb-7">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="contents" aria-label="Banister International home">
            <Img src="/assets/banister-logo-white.png" alt="Banister International"
              className="block h-[clamp(44px,5.6vw,68px)] w-auto max-w-[65%] cursor-pointer object-contain" />
          </Link>
          <div className="flex flex-none gap-2.5">
            {/* [assumption] LinkedIn URL not given in the design — the icon is not linked yet. */}
            <Img src="/assets/icon-linkedin.png" alt="LinkedIn" className={icon} />
            <Link href="/contact" className="block"><Img src="/assets/icon-email.png" alt="Email" className={icon} /></Link>
            <Link href="/contact" className="block"><Img src="/assets/icon-phone.png" alt="Phone" className={icon} /></Link>
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-x-8 gap-y-7">
          {siteMap.map((col) => (
            <div key={col.title} className="flex flex-col gap-2.5">
              <Link href={col.href} className="mb-1 cursor-pointer text-[12.5px] font-extrabold tracking-[.1em] text-white uppercase no-underline hover:text-white">{col.title}</Link>
              {col.links.map((l) => (
                <Link key={l.t} href={l.href} className="cursor-pointer text-[14px] leading-[1.4] text-[#d6e6ee] no-underline hover:text-white hover:underline">{l.t}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t border-white/28 pt-5">
          <span className="text-[13px] font-semibold tracking-[.1em]">AMERICAS • EUROPE • MIDDLE EAST • ASIA PACIFIC</span>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1.5 text-[13.5px]">
            <span>Copyright © 2026 Banister International</span><span>|</span>
            <span className="cursor-pointer hover:underline">Privacy Policy</span><span>|</span>
            <span className="cursor-pointer hover:underline">Terms and Conditions</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
