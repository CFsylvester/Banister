"use client";
import { type CSSProperties, useEffect, useRef } from "react";
import { Icon } from "@/components/ui";

// Industries icon that rises into place the first time it scrolls into view (globals.css .reveal-icon). The
// server render is the visible icon; it's only hidden once this effect arms it, so no-JS and reduced-motion
// visitors always see it. `hover` names an optional per-icon motion, played while the parent card is hovered.
export type HoverMotion = "fly" | "drive" | "spin" | "roll" | "hop" | "pulse" | "lift" | "nod" | "flip" | "wiggle";

export default function RevealIcon({ src, delayMs = 0, hover, className }: {
  src: string; delayMs?: number; hover?: HoverMotion; className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || !matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    // Already on screen at hydration: hiding it now would read as a flicker (visible → gone → rising), so skip the rise.
    const { top, bottom } = el.getBoundingClientRect();
    if (bottom > 0 && top < innerHeight) return;
    el.dataset.armed = "";
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      el.dataset.shown = "";
      io.disconnect();
    }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span ref={ref} className={className ? `reveal-icon ${className}` : "reveal-icon"} data-hover={hover}
      style={{ "--delay": `${delayMs}ms` } as CSSProperties}>
      <Icon src={src} className="object-contain" />
    </span>
  );
}
