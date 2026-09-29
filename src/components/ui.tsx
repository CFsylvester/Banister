/* eslint-disable @next/next/no-img-element -- plain <img> keeps pixel parity with the design target while the
   real assets are placeholders; move hero/LCP images to next/image once final exports land. */
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { Tag } from "@/lib/content";

export const Img = (props: ComponentProps<"img">) => <img alt="" {...props} />;

const ctaBase = "flex cursor-pointer items-center gap-[18px] font-bold tracking-[.06em] no-underline";

/** Solid navy "SPEAK WITH A PARTNER →" style button. */
export function NavyCta({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`${ctaBase} bg-navy px-[22px] py-[14px] text-[12.5px] text-white hover:bg-navy-hover hover:text-white ${className}`}>
      {children} <span>→</span>
    </Link>
  );
}

/** Outlined "LEARN MORE →" button (renders a non-link span when no href, as the newsroom cards do). */
export function OutlineCta({ href, children, className = "px-4 py-2.5" }: { href?: string; children: ReactNode; className?: string }) {
  const cls = `${ctaBase} self-start border border-navy text-[12.5px] text-navy hover:bg-navy hover:text-white ${className}`;
  const inner = <>{children} <span>→</span></>;
  return href ? <Link href={href} className={cls}>{inner}</Link> : <span className={cls}>{inner}</span>;
}

export function Tags({ tags }: { tags: Tag[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tg) => (
        <span key={tg.t} className="border px-[9px] py-[5px] text-[11px] leading-none font-bold tracking-[.08em] uppercase"
          style={{ background: tg.bg, color: tg.fg, borderColor: tg.bd }}>{tg.t}</span>
      ))}
    </div>
  );
}

export const h2Cls = "m-0 text-[clamp(26px,2.4vw,32px)] font-bold";
