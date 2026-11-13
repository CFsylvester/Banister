/* eslint-disable @next/next/no-img-element -- Icon is a plain <img> on purpose: SVGs gain nothing from the image
   optimizer (next/image would skip them anyway; image.md, `dangerouslyAllowSVG`). */
import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { asset } from "@/lib/asset";
import type { Tag } from "@/lib/content";

/** Photos (jpg/png/webp, local or Contentful) through next/image, so each viewer gets an AVIF/WebP sized to the
 * rendered width (next.config.ts `images`). Give it either `fill` (the parent is positioned and sizes it) or a
 * width/height whose ratio matches the CSS aspect ratio — the box's size still comes from the class, the numbers only
 * reserve its shape — plus `sizes` saying how wide it renders (image.md, `sizes`: without it the browser assumes 100vw).
 *
 * Above-the-fold images pass loading="eager" (and fetchPriority="high" for the LCP image); next/image is lazy
 * otherwise. `preload`/`priority` are left out of the props: image.md says not to use `preload` together with
 * `loading` or `fetchPriority`, and `priority` is deprecated in v16. next/image is a client component (`'use client'`
 * at the top of next/dist/client/image-component.js), so the server components that render it put no <img> into the
 * RSC payload and React adds no image preload hint there — another page's <Link> prefetch downloads nothing. */
export const Img = ({ src, alt = "", style, ...props }: Omit<ImageProps, "src" | "alt" | "preload" | "priority"> & { src: string; alt?: string }) => (
  // `height: auto`: this site has no Tailwind Preflight (globals.css), so without it the height attribute would set
  // the box's height instead of the class's aspect ratio.
  <Image alt={alt} {...props} style={props.fill ? style : { height: "auto", ...style }} src={asset(src)} />
);

// SVG icons and logos stay a plain <img>, lazy by default: React DOM emits a <link rel="preload"> for every eager
// <img>, and those hints ride along in the RSC payloads <Link> prefetches, so an eager image on /services was
// downloaded by every page that links there (the `case "img"` preload in
// next/dist/compiled/react-dom/cjs/react-dom-server.node.production.js and in
// next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-server.node.production.js both skip
// loading="lazy", fetchPriority="low", data: URLs, and images inside <picture> or <noscript>).
export const Icon = ({ src, loading = "lazy", ...props }: ComponentProps<"img">) => (
  <img alt="" loading={loading} {...props} src={typeof src === "string" ? asset(src) : src} />
);

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
