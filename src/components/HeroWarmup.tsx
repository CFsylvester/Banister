"use client";
import { getImageProps } from "next/image";
import { useEffect } from "react";
import type { HeroImage } from "@/config/heroes";
import { asset } from "@/lib/asset";

type Conn = { saveData?: boolean; effectiveType?: string };

// Once per page load: a root-layout re-render (router.refresh, a server action, a revalidation) hands this a new
// `heroes` array and re-runs the effect, and the images are already warm by then.
let warmed = false;

/**
 * Downloads every page's hero once the current page has finished loading, so a click to another page paints its hero
 * from cache instead of flashing an empty frame while it downloads. It waits for `load` and then an idle slot and
 * fetches at low priority, so it never competes with this page's own images. Each request copies the page's
 * next/image props (getImageProps, image.md "getImageProps"): with the same srcset and sizes the browser picks the
 * same /_next/image candidate the next page will ask for. Skipped on Save-Data and 2G. It lives in the root layout,
 * so it runs once per full page load; client-side navigations keep the layout, and the `warmed` flag covers re-renders.
 */
export default function HeroWarmup({ heroes }: { heroes: HeroImage[] }) {
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: Conn }).connection;
    if (warmed || conn?.saveData || /2g/.test(conn?.effectiveType ?? "")) return;

    let idle = 0;
    const run = () => {
      warmed = true;
      for (const hero of heroes) {
        const { props } = getImageProps({ ...hero, src: asset(hero.src), alt: "" });
        const img = new Image();
        img.fetchPriority = "low";
        // sizes and srcset before src: the browser selects its candidate from them when src is set.
        if (props.sizes) img.sizes = props.sizes;
        if (props.srcSet) img.srcset = props.srcSet;
        img.src = props.src;
      }
    };
    const warm = () => {
      idle = window.requestIdleCallback ? window.requestIdleCallback(run, { timeout: 3000 }) : window.setTimeout(run, 200);
    };

    if (document.readyState === "complete") warm();
    else window.addEventListener("load", warm, { once: true });
    return () => {
      window.removeEventListener("load", warm);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
    };
  }, [heroes]);

  return null;
}
