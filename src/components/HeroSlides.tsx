"use client";
import { useEffect, useRef, useState } from "react";
import { Img } from "./ui";

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Cross-fading Ken Burns hero: each slide eases to scale(1.06) over 7s, advances every 6s. */
/** `slides` are image paths from the CMS (src/lib/cms/map/hero.ts). One image = no slideshow timer. */
export default function HeroSlides({ slides: heroes }: { slides: string[] }) {
  const [h, setH] = useState(0);
  const [shown, setShown] = useState(false);
  // `cycle` restarts the timers exactly as the design's startHero() does after each advance.
  const [cycle, setCycle] = useState(0);
  // Slides rendered so far. Hidden slides sit in the viewport at opacity 0, so loading="lazy" wouldn't hold them back:
  // they aren't rendered at all until needed. Slide 1 mounts once slide 0 has loaded, and each advance mounts the slide
  // after the new one, so the next image downloads during the 6s it waits. Server and first client render agree (1).
  const [mounted, setMounted] = useState(1);
  const mountedRef = useRef(1);
  useEffect(() => { mountedRef.current = mounted; }, [mounted]);
  const slideshow = () => heroes.length > 1 && !reduceMotion();

  useEffect(() => {
    // `shown` is reset to false by whatever bumps `cycle`, so the 40ms re-show below replays the entrance.
    const show = setTimeout(() => setShown(true), 40);
    if (reduceMotion() || heroes.length < 2) return () => clearTimeout(show);
    const next = setTimeout(() => {
      const to = (h + 1) % heroes.length;
      // Slide 0 took over 6s (or failed), so the next slide was never mounted: mount it now and wait one more cycle
      // instead of fading to an empty frame.
      if (mountedRef.current <= to) { setMounted((m) => Math.max(m, to + 1)); setCycle((c) => c + 1); return; }
      setH(to); setShown(false); setCycle((c) => c + 1);
      setMounted((m) => Math.max(m, Math.min(heroes.length, to + 2)));
    }, 6000);
    return () => { clearTimeout(show); clearTimeout(next); };
  }, [cycle, h, heroes.length]);

  return heroes.slice(0, mounted).map((src, i) => (
    // Slide 0 is the LCP image. Later slides stay hidden for 6s, so they fetch at low priority instead of
    // competing with it. The frame is the .site box less its gutters: 1144px at full width, ~92vw below.
    <Img key={`${i}-${src}`} src={src} fill sizes="(min-width: 1240px) 1144px, 92vw"
      loading="eager" fetchPriority={i === 0 ? "high" : "low"}
      onLoad={i === 0 ? () => { if (slideshow()) setMounted((m) => Math.max(m, 2)); } : undefined}
      className="object-cover object-[50%_30%]"
      style={{ opacity: i === h ? 1 : 0, transform: i === h && shown ? "scale(1.06)" : "scale(1)", transition: "opacity 1.2s ease, transform 7s linear" }} />
  ));
}
