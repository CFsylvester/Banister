"use client";
import { useEffect, useRef, useState } from "react";
import { GRID_4, stats } from "@/lib/content";

const DURATION = 1600, STAGGER = 150;

/** Count-up stat cards: start when 35% of the grid is visible, ease-out-cubic, 150ms stagger per card. */
export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<{ start: number; now: number } | null>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const run = () => {
      const start = performance.now(); setT({ start, now: start });
      const tick = () => { const now = performance.now(); setT({ start, now });
        if (now - start < DURATION + 3 * STAGGER + 50) raf = requestAnimationFrame(tick); };
      raf = requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) { run(); return () => cancelAnimationFrame(raf); }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); run(); } }, { threshold: 0.35 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="site px-gutter pt-[clamp(56px,7vw,96px)]">
      <h2 className="m-0 mb-7 text-[clamp(26px,2.4vw,32px)] font-bold text-navy">Our track record</h2>
      <div ref={ref} className="grid gap-5" style={{ gridTemplateColumns: GRID_4(20) }}>
        {stats.map(([n, suffix, label], i) => {
          const p = t ? Math.max(0, Math.min(1, (t.now - t.start - i * STAGGER) / DURATION)) : 0;
          const e = 1 - Math.pow(1 - p, 3);
          return (
            <div key={label} className="relative flex flex-col gap-3.5 bg-mist px-7 pt-9 pb-8"
              style={{ opacity: t ? 1 : 0, transform: t ? "none" : "translateY(16px)", transition: "opacity .6s ease, transform .6s cubic-bezier(.2,.8,.2,1)" }}>
              <span className="absolute top-0 left-0 h-1 bg-gold" style={{ width: `${e * 100}%` }} />
              <span className="grid text-[clamp(42px,4.2vw,60px)] leading-none font-extrabold tracking-[-.02em] text-navy tabular-nums">
                <span className="invisible [grid-area:1/1]" aria-hidden="true">{n.toLocaleString("en-US") + suffix}</span>
                <span className="[grid-area:1/1]">{Math.round(n * e).toLocaleString("en-US")}<span className="text-teal">{suffix}</span></span>
              </span>
              <span className="h-[2px] w-10 bg-teal" />
              <span className="text-[15px] leading-[1.45] text-pretty text-ink">{label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
