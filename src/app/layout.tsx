import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SubscribeBand from "@/components/SubscribeBand";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import HeroWarmup from "@/components/HeroWarmup";
import { HOME_SLIDE_SIZES, PAGE_HEROES, type HeroImage } from "@/config/heroes";
import { mapHero } from "@/lib/cms/map/hero.ts";
import { getPage } from "@/lib/cms/source";
import { SITE_NAME, SITE_URL, siteJsonLd } from "@/lib/seo";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  // Latin only: → ● ✓ render in system-ui (Arrow, Dot, Check in components/ui.tsx), so nothing needs "symbols" — Open
  // Sans drew none of them anyway. `subsets` only decides the preloads; every subset's @font-face rule still ships
  // (fixture build, 2026-11-13: 20 rules = 10 subsets x normal + italic).
  subsets: ["latin"],
  // No `weight`: Open Sans is variable (font.md, `weight`: required only for non-variable fonts), so next/font emits one
  // face per subset spanning its wght axis, 300–800 (next/dist/compiled/@next/font/dist/google/font-data.json). Listing
  // weights emitted one identical face per weight per subset.
  // Italic is a separate, non-preloaded instance below.
  style: "normal",
  // Match the design's stack exactly ('Open Sans', system-ui): glyphs Open Sans lacks (e.g. ↓ →) must fall back
  // to system-ui, not next/font's metric-adjusted Arial. Trade-off: slightly more CLS while the font swaps in.
  // Option documented in node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md.
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

// Italic faces (the article's <em>s; Quotes' attribution when it is restored) are declared but not preloaded, so a
// route only downloads them when italic text renders. They share the "Open Sans" family name, so `font-style: italic`
// picks them up (font.md, `preload`). Turbopack rejects a second instance of the same family with the options above
// ("next/font/google queries have exactly one entry"), so this one is minimal: Open Sans is variable, so it covers
// every weight, and `subsets` only decides what gets preloaded (font.md, `subsets`).
const openSansItalic = Open_Sans({
  variable: "--font-open-sans-italic", subsets: ["latin"], style: "italic", preload: false,
  // Nothing reads this instance's family list (body uses --font-open-sans), so its metric-adjusted "Open Sans Fallback"
  // @font-face was dead CSS. Turbopack only dropped that rule once `fallback` was given too (adjustFontFallback: false
  // alone still emitted it — fixture build, 2026-11-13).
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

// metadataBase resolves every relative metadata URL (OG images) against production (generate-metadata.md, "metadataBase").
// No canonical here: a page that forgot its own would inherit one pointing at another URL. Each page sets the full set
// with pageMetadata() (src/lib/seo.ts).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: "Partner-led executive search since 1999, placing leaders from Senior Director to C-suite and board level across eleven industries.",
  openGraph: { siteName: SITE_NAME, locale: "en_US", type: "website" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Heroes to warm after load (HeroWarmup). Home contributes only its first slide: HeroSlides loads the later ones one
  // at a time on purpose. getPage is cached ('use cache'), so this shares the homepage's read. .catch, not .then's
  // second argument: it must also swallow a ContentError thrown by mapHero, or bad home content would fail the root
  // layout and every route with it. Here a failure only leaves the slide unwarmed; the homepage still reports it.
  const homeSlide = await getPage("home").then((p) => mapHero(p).media.images[0]).catch(() => undefined);
  const heroes: HeroImage[] = [
    ...(homeSlide ? [{ src: homeSlide, fill: true as const, sizes: HOME_SLIDE_SIZES }] : []),
    ...Object.values(PAGE_HEROES),
  ];

  return (
    <html lang="en" className={`${openSans.variable} ${openSansItalic.variable}`}>
      {/* Nothing reads --font-open-sans-italic; the class only keeps openSansItalic in use. The italic @font-face CSS
          comes from the Open_Sans() call itself (a build without the class still ships it). */}
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body> before
          React hydrates. suppressHydrationWarning only covers this element's own attributes, one level
          deep — mismatches in children still report. https://react.dev/reference/react-dom/client/hydrateRoot */}
      <body suppressHydrationWarning>
        <JsonLd data={siteJsonLd} />
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SubscribeBand />
          <SiteFooter />
        </div>
        <HeroWarmup heroes={heroes} />
      </body>
    </html>
  );
}
