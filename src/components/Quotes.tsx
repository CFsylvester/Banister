"use client";
import { useEffect, useState } from "react";
import { quotes } from "@/lib/content";

type Mode = "words" | "slide" | "fade";
const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Testimonial carousel: words blur/rise in with a 45ms stagger, attribution follows, a 7s progress bar fills,
 * then it fades and advances. Dots jump to a quote and restart the timer.
 * `fadeMs` — the home page fades the outgoing quote over .6s, the industries page over .3s.
 */
export default function Quotes({ className = "", fadeMs = 600, mode = "words" }: { className?: string; fadeMs?: number; mode?: Mode }) {
  const [q, setQ] = useState(0);
  const [shown, setShown] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    // `shown` is reset to false by whatever bumps `cycle`, so the 40ms re-show below replays the entrance.
    const show = setTimeout(() => setShown(true), 40);
    if (reduceMotion()) return () => clearTimeout(show);
    let adv: ReturnType<typeof setTimeout> | undefined;
    const next = setTimeout(() => {
      if (document.visibilityState === "hidden") { setShown(false); setCycle((c) => c + 1); return; }
      setShown(false);
      adv = setTimeout(() => { setQ((x) => (x + 1) % quotes.length); setCycle((c) => c + 1); }, 320);
    }, 7000);
    return () => { clearTimeout(show); clearTimeout(next); clearTimeout(adv); };
  }, [cycle]);

  return (
    <section className={`bg-navy ${className}`}>
      <div className="site px-gutter py-[clamp(56px,7vw,88px)]">
        <h2 className="m-0 mb-8 text-[clamp(26px,2.4vw,32px)] font-bold text-teal">What our clients are saying</h2>
        <div className="grid max-w-[980px] grid-cols-[72px_minmax(0,1fr)] gap-x-5 gap-y-2">
          <span className="font-[Georgia,serif] text-[110px] leading-[.8] font-extrabold text-teal" aria-hidden="true">“</span>
          <div className="grid" aria-live="polite">
            {quotes.map((x, i) => {
              const on = i === q && shown;
              const parts = x.text.split(/(?<=\s)/);
              const wd = mode === "words" ? parts.length * 0.045 + 0.2 : 0.35;
              return (
                <div key={i} className="flex flex-col gap-5 [grid-area:1/1]"
                  style={{ visibility: i === q ? "visible" : "hidden", opacity: 1, transition: `opacity ${fadeMs / 1000}s${fadeMs === 600 ? " ease" : ""}` }}>
                  <p className="m-0 text-[clamp(20px,2vw,26px)] leading-[1.5] font-semibold text-white">
                    {parts.map((t, k) => {
                      const d = mode === "words" ? k * 0.045 : 0;
                      return (
                        <span key={k} className="inline-block whitespace-pre" style={{
                          opacity: on ? 1 : 0,
                          transform: on || mode === "fade" ? "none" : mode === "words" ? "translateY(.35em)" : "translateY(22px)",
                          filter: on || mode !== "words" ? "none" : "blur(4px)",
                          transition: on ? `opacity .55s ease ${d}s, transform .7s cubic-bezier(.2,.8,.2,1) ${d}s, filter .55s ease ${d}s` : "opacity .3s ease, transform 0s linear .3s, filter 0s linear .3s",
                        }}>{t}</span>
                      );
                    })}
                  </p>
                  <div className="flex items-end justify-between gap-6">
                    <span className="min-w-0 flex-1 text-[15px] text-teal italic"
                      style={{ opacity: on ? 1 : 0, transition: on ? `opacity .6s ease ${wd}s` : "opacity .3s ease" }}>— {x.who}</span>
                    <span className="h-11 self-end font-[Georgia,serif] text-[110px] leading-[.5] font-extrabold text-teal" aria-hidden="true">”</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-10 flex items-center justify-center">
          <div className="flex gap-3">
            {quotes.map((_, i) => {
              const on = i === q && shown;
              return (
                <button key={i} type="button" aria-label={`Show testimonial ${i + 1}`} aria-current={i === q ? "true" : undefined}
                  onClick={() => { setQ(i); setShown(false); setCycle((c) => c + 1); }}
                  className="relative m-0 block h-[19px] w-14 cursor-pointer border-0 bg-transparent p-0">
                  <span className="absolute top-2 right-0 left-0 h-[3px] bg-white/28" />
                  <span className="absolute top-2 left-0 h-[3px] bg-gold" style={{ width: on ? "100%" : "0%", transition: on ? "width 7s linear" : "none" }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
