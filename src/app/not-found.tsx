import type { Metadata } from "next";
import Link from "next/link";
import { NavyCta } from "@/components/ui";
import { SITE_NAME } from "@/lib/seo";

// Every unmatched URL and every notFound() (e.g. /insights/ while the listing is hidden) renders this. Next adds
// `noindex` to 404 responses itself (not-found.md, "Metadata", and seen in `next start` output, 2026-11-13). Replacing the default UI also drops its own <title>,
// which doubled up with the layout's in the rendered HTML (seen in `next build` output, 2026-11-13).
// The `metadata` title below reaches unmatched URLs only. Under notFound() this UI is streamed into the page and the
// title stays the layout's "Banister International" (next build + browser, Next 16.3.7, 2026-11-13; not-found.md
// documents `metadata` for global-not-found.js only) — still one title, and the page is noindex.
export const metadata: Metadata = { title: `Page not found | ${SITE_NAME}` };

const links = [
  { href: "/services", label: "Executive search services" },
  { href: "/industries", label: "Industries we serve" },
  { href: "/about", label: "Our leadership team" },
];

export default function NotFound() {
  return (
    <section className="site px-gutter flex flex-col gap-5 py-[clamp(72px,10vw,140px)]">
      <span className="h-1 w-14 bg-teal" />
      <h1 className="m-0 text-[clamp(36px,4vw,52px)] leading-[1.1] font-bold tracking-[-.01em] text-navy">Page not found</h1>
      <p className="m-0 max-w-[620px] text-[18px] leading-[1.65] text-pretty text-navy">
        The page you were looking for has moved or no longer exists. These are good places to pick up from:
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[16px]">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-navy underline decoration-1 underline-offset-[6px] hover:text-navy-hover">{l.label}</Link>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-x-7 gap-y-4">
        <NavyCta href="/contact">SPEAK WITH A PARTNER</NavyCta>
      </div>
    </section>
  );
}
