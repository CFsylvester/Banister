"use client";
/* eslint-disable @next/next/no-img-element -- see ui.tsx */
import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Cross-fading Ken Burns hero: each slide eases to scale(1.06) over 7s, advances every 6s. */
/** `slides` are image paths from the CMS (src/lib/cms/map/home.ts). */
export default function HeroSlides({ slides: heroes }: { slides: string[] }) {
  const [h, setH] = useState(0);
  const [shown, setShown] = useState(false);
  // `cycle` restarts the timers exactly as the design's startHero() does after each advance.
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    // `shown` is reset to false by whatever bumps `cycle`, so the 40ms re-show below replays the entrance.
    const show = setTimeout(() => setShown(true), 40);
    if (reduceMotion()) return () => clearTimeout(show);
    const next = setTimeout(() => { setH((x) => (x + 1) % heroes.length); setShown(false); setCycle((c) => c + 1); }, 6000);
    return () => { clearTimeout(show); clearTimeout(next); };
  }, [cycle, heroes.length]);

  return heroes.map((src, i) => (
    <img key={src} src={asset(src)} alt=""
      className="absolute inset-0 h-full w-full object-cover object-[50%_30%]"
      style={{ opacity: i === h ? 1 : 0, transform: i === h && shown ? "scale(1.06)" : "scale(1)", transition: "opacity 1.2s ease, transform 7s linear" }} />
  ));
}
