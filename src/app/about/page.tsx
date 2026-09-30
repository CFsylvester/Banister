import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import PersonBio from "@/components/PersonBio";
import { people } from "@/lib/content";

export const metadata: Metadata = { title: "About — Banister International" };

export default function AboutPage() {
  return (
    <>
      <PageHero img="/assets/about-atrium.jpg" title="About"
        lede="Founded in 1999, Banister International is a human capital advisory firm providing exceptional talent solutions to transformational, high-performing organizations.">
        <p className="m-0 text-[16px] leading-[1.75] text-pretty">
          The firm is built on four values: quality, execution, speed and insight. Our hands-on managing director–partner model, technology-enabled tools and trusted global network allow selective client partnerships, full process transparency and unmatched efficiency.
        </p>
      </PageHero>
      <section className="site px-gutter py-[clamp(56px,7vw,88px)]">
        <h2 className="m-0 mb-2 text-[clamp(26px,2.4vw,32px)] font-bold text-navy">Leadership</h2>
        {people.map((p) => <PersonBio key={p.id} person={p} />)}
      </section>
    </>
  );
}
