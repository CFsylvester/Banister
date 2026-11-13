import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SubscribeBand from "@/components/SubscribeBand";
import SiteFooter from "@/components/SiteFooter";
import JsonLd from "@/components/JsonLd";
import { SITE_NAME, SITE_URL, siteJsonLd } from "@/lib/seo";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  // "symbols" carries the → ↓ arrows used in every CTA; without it they fall back to a system glyph.
  subsets: ["latin", "symbols"],
  weight: ["400", "600", "700", "800"],
  // Italic is a separate, non-preloaded instance below.
  style: "normal",
  // Match the design's stack exactly ('Open Sans', system-ui): glyphs Open Sans lacks (e.g. ↓) must fall back
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
const openSansItalic = Open_Sans({ variable: "--font-open-sans-italic", subsets: ["latin"], style: "italic", preload: false });

// metadataBase resolves every relative metadata URL (OG images) against production (generate-metadata.md, "metadataBase").
// No canonical here: a page that forgot its own would inherit one pointing at another URL. Each page sets the full set
// with pageMetadata() (src/lib/seo.ts).
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: "Partner-led executive search since 1999, placing leaders from Senior Director to C-suite and board level across eleven industries.",
  openGraph: { siteName: SITE_NAME, locale: "en_US", type: "website" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
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
      </body>
    </html>
  );
}
