import Link from "next/link";
import { siteMap } from "@/lib/content";
import { Icon } from "./ui";

// One continuous gradient. The cyan starts right under the last row of text and eases in over the empty bottom band,
// so there is no seam where it begins.
const bg = `linear-gradient(180deg,#003f5e 0%,#00415f 25%,#0d6781 calc(100% - var(--band)),#13798f calc(100% - var(--band) * .75),#1b90a0 calc(100% - var(--band) * .5),#23a8b3 calc(100% - var(--band) * .25),#2bc1c6 100%)`;

const icon = "block h-[42px] w-[42px] cursor-pointer transition-opacity duration-200 group-hover:opacity-85 group-focus-visible:opacity-85";

export default function SiteFooter() {
  return (
    <footer className="text-white [--band:clamp(56px,6vw,88px)]" style={{ background: bg }}>
      {/* Text sits on the dark part only: white on #0d6781 is 6.4:1, #e3edf2 is 5.5:1 (WCAG 1.4.3 needs 4.5:1).
          The cyan (white on #2bc1c6 is 2.2:1) fades in across the empty band below the text. */}
      <div className="site px-gutter pt-[clamp(48px,6vw,76px)] pb-5">
        {/* Logo left, contact icons right. */}
        <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/20 pb-[clamp(32px,4vw,46px)]">
          <Link href="/" className="group block" aria-label="Banister International home">
            <Icon src="/assets/banister-logo-white.svg" alt="Banister International" width={530} height={122}
              className="block h-[clamp(40px,4vw,48px)] w-auto cursor-pointer object-contain transition-opacity duration-200 group-hover:opacity-85 group-focus-visible:opacity-85" />
          </Link>
          <div className="flex gap-3.5">
            <a href="https://www.linkedin.com/company/banisterinternational/home/" target="_blank" rel="noopener noreferrer" className="group block">
              <Icon src="/assets/icon-linkedin.svg" alt="Banister International on LinkedIn (opens in a new tab)" className={icon} />
            </a>
            <a href="mailto:info@banisterintus.com" className="group block">
              <Icon src="/assets/icon-email.svg" alt="Email info@banisterintus.com" className={icon} />
            </a>
            <a href="tel:+12246555563" className="group block">
              <Icon src="/assets/icon-phone.svg" alt="Call (224) 655-5563" className={icon} />
            </a>
          </div>
        </div>
        {/* Three equal columns. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 border-b border-white/20 py-[clamp(40px,4.4vw,52px)] sm:grid-cols-3">
          {siteMap.map((col) => (
            <div key={col.title} className="flex flex-col items-start gap-[14px]">
              <Link href={col.href} className="mb-1.5 cursor-pointer text-[11.5px] font-extrabold tracking-[.14em] text-white uppercase no-underline hover:text-white">{col.title}</Link>
              {col.links.map((l) => (
                <Link key={l.t} href={l.href} className="cursor-pointer text-[14.5px] leading-[1.4] text-[#e3edf2] no-underline hover:text-white hover:underline">{l.t}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 pt-7 md:flex-row md:items-center md:justify-between md:gap-8">
          {/* [Design Choice, owner 2026-11-13] was "AMERICAS · EUROPE · MIDDLE EAST · ASIA PACIFIC"; under the US-only position
              that line was the clearest sign of targeting other regions (reports/Banister privacy and terms findings.md). */}
          <span className="text-[11.5px] font-semibold tracking-[.14em]">CHICAGO · UNITED STATES</span>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-[#e3edf2]">
            <span>© 2026 Banister International</span>
            <Link href="/privacy/" className="text-inherit no-underline hover:underline">Privacy Policy</Link>
            <Link href="/terms-and-conditions/" className="text-inherit no-underline hover:underline">Terms and Conditions</Link>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="h-(--band)" />
    </footer>
  );
}
