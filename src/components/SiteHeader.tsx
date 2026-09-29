"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/lib/content";
import { Img } from "./ui";

// The design switches desktop nav ↔ burger at innerWidth 820 (isMobile = vw < 820).
const MOBILE_MQ = "(max-width: 819.98px)";

export default function SiteHeader() {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) { setLastPath(pathname); setMenu(false); }

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => { if (!mq.matches) setMenu(false); };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const headBg = pathname === "/" ? "#003f5e" : "linear-gradient(180deg,#003f5e 0%,#003f5e 55%,#0b5f7a 85%,#1f9fb0 100%)";

  return (
    <header style={{ background: headBg }}>
      <div className="site px-gutter flex flex-wrap items-center justify-between gap-x-10 gap-y-4 pt-[26px] pb-[34px]">
        <Link href="/" className="block" aria-label="Banister International home">
          <Img src="/assets/banister-logo-white.png" alt="Banister International" className="block h-[52px] w-auto cursor-pointer" />
        </Link>
        <nav className="hidden flex-wrap gap-[clamp(18px,2.6vw,36px)] min-[820px]:flex" aria-label="Main">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(n.href) ? "page" : undefined}
              className={`cursor-pointer border-t-2 pt-2 text-[14px] font-semibold text-white no-underline hover:border-t-gold hover:text-white ${isActive(n.href) ? "border-t-gold" : "border-t-transparent"}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={() => setMenu((m) => !m)} aria-label="Menu" aria-expanded={menu} aria-controls="mobile-menu"
          className="flex h-12 w-12 cursor-pointer flex-col items-center justify-center gap-[5px] border border-white/50 bg-transparent p-0 min-[820px]:hidden">
          <span className="block h-[2px] w-[22px] bg-white transition-transform duration-300" style={{ transform: menu ? "translateY(7px) rotate(45deg)" : "none" }} />
          <span className="block h-[2px] w-[22px] bg-white transition-opacity duration-200" style={{ opacity: menu ? 0 : 1 }} />
          <span className="block h-[2px] w-[22px] bg-white transition-transform duration-300" style={{ transform: menu ? "translateY(-7px) rotate(-45deg)" : "none" }} />
        </button>
      </div>
      <div id="mobile-menu" className="grid min-[820px]:hidden"
        style={{ gridTemplateRows: menu ? "1fr" : "0fr", transition: "grid-template-rows .4s cubic-bezier(.2,.8,.2,1)" }} inert={!menu}>
        <nav className="px-gutter flex min-h-0 flex-col overflow-hidden" aria-label="Mobile">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}
              className="flex min-h-14 cursor-pointer items-center justify-between border-t border-white/18 text-[18px] font-semibold text-white no-underline hover:text-white">
              {n.label}<span className="text-[16px]" style={{ color: isActive(n.href) ? "#ffc91e" : "transparent" }}>●</span>
            </Link>
          ))}
          <Link href="/contact"
            className="mt-4 mb-6 flex cursor-pointer items-center justify-center gap-[18px] bg-gold px-6 py-4 text-[13px] font-extrabold tracking-[.06em] text-navy no-underline hover:text-navy">
            SPEAK WITH A PARTNER <span>→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
