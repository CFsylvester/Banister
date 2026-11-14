// Every hero image the site renders, with the exact next/image props each one uses. The pages render from these and
// <HeroWarmup> (root layout) warms them, so both ask the optimizer for the same /_next/image URL and the warmed copy
// is the one the next page paints. Change a hero's size here, never at the call site, or the warm-up fetches a file
// nothing uses.

// Exclusive on purpose: next/image rejects `fill` together with width/height, but only at runtime.
export type HeroImage = { src: string; sizes: string } &
  ({ fill: true; width?: never; height?: never } | { fill?: never; width: number; height: number });
/** A hero with a fixed shape, which PageHero's layout needs (a `fill` image would escape its non-positioned section). */
export type SplitHero = Extract<HeroImage, { width: number }>;

/** Split hero (PageHero): photo left, mist panel right. Side by side (from an 800px section, the two flex bases) the
 * photo gets 420px plus 1/2.35 of the rest: 515px of 1024, 692px of 1440, so 53vw covers it; stacked it spans the
 * viewport. The breakpoint is 820px so a classic scrollbar (section narrower than the viewport) can't leave a stacked
 * photo sized for 53vw. */
const split = (src: string): SplitHero => ({ src, width: 1200, height: 1000, sizes: "(min-width: 820px) 53vw, 100vw" });

export const PAGE_HEROES = {
  services: split("/assets/services-hero.jpg"),
  industries: split("/assets/industries-hero.jpg"),
  about: split("/assets/about-atrium.jpg"),
  /** White paper: fills the left half from lg, the full width below. */
  article: { src: "/assets/insight-state-of-ta.jpg", fill: true, sizes: "(min-width: 1024px) 50vw, 100vw" },
} satisfies Record<string, HeroImage>;

/** Homepage slides (HeroSlides): the frame is the .site box less its gutters, 1144px at full width, ~92vw below. */
export const HOME_SLIDE_SIZES = "(min-width: 1240px) 1144px, 92vw";
