"use client";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

// Marks its element data-shown the first time it scrolls into view, so CSS can play an entrance (globals.css:
// .reveal-icon, .driver). The server render is the finished state; the hidden start state only applies once this
// effect sets data-armed, so no-JS and reduced-motion visitors always see the content. `delayMs` sets --delay inline to
// stagger siblings; leave it out to let the stylesheet set --delay instead.
export default function Reveal({ className, delayMs, style, children, ...data }: {
  className: string; delayMs?: number; style?: CSSProperties; children: ReactNode;
  [dataAttr: `data-${string}`]: string | undefined;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window) || !matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    // Already on screen at hydration: hiding it now would read as a flicker (visible → gone → entering), so skip it.
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
    <div ref={ref} className={className} {...data} style={{ ...(delayMs !== undefined && { "--delay": `${delayMs}ms` }), ...style } as CSSProperties}>
      {children}
    </div>
  );
}
