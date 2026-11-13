import type { ReactNode } from "react";
import Blank from "./Blank";
import { LEGAL } from "@/lib/legal";

/** Shared layout and text blocks for /privacy/ and /terms-and-conditions/. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="px-gutter mx-auto max-w-[820px] pt-[clamp(48px,6vw,72px)] pb-[clamp(64px,7vw,96px)] text-[16.5px] leading-[1.7] text-ink">
      <h1 className="m-0 mb-3 text-[clamp(32px,3.4vw,44px)] font-bold text-navy">{title}</h1>
      <p className="m-0 mb-8 text-[14px] text-slate">Effective <Blank>{LEGAL.effectiveDate}</Blank></p>
      {children}
    </article>
  );
}

export const H2 = ({ id, children }: { id?: string; children: ReactNode }) => (
  <h2 id={id} className="m-0 mt-10 mb-3 scroll-mt-24 text-[clamp(22px,2.2vw,26px)] font-bold text-navy">{children}</h2>
);
export const P = ({ children }: { children: ReactNode }) => <p className="m-0 mb-4">{children}</p>;
export const Ul = ({ children }: { children: ReactNode }) => <ul className="m-0 mb-4 flex list-disc flex-col gap-1.5 pl-6">{children}</ul>;
export const linkCls = "font-semibold text-navy underline";
export const Email = () => <a href={`mailto:${LEGAL.privacyEmail}`} className={linkCls}>{LEGAL.privacyEmail}</a>;
