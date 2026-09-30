import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import SubscribeBand from "@/components/SubscribeBand";
import SiteFooter from "@/components/SiteFooter";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  // "symbols" carries the → ↓ arrows used in every CTA; without it they fall back to a system glyph.
  subsets: ["latin", "symbols"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  // Match the design's stack exactly ('Open Sans', system-ui): glyphs Open Sans lacks (e.g. ↓) must fall back
  // to system-ui, not next/font's metric-adjusted Arial. Trade-off: slightly more CLS while the font swaps in.
  // Option documented in node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md.
  adjustFontFallback: false,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Banister International",
  description: "Banister International is a human capital advisory firm delivering high-impact talent solutions to transformational organizations.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={openSans.variable}>
      <body>
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
