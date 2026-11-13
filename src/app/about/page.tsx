import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/PageHero";
import PersonBio from "@/components/PersonBio";
import JsonLd from "@/components/JsonLd";
import { people } from "@/lib/content";
import { absUrl, orgRef, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "About Banister International | Executive Search Since 1999",
  description: "Founded in 1999, Banister International is an executive search and human capital advisory firm. Meet our leadership team.",
  path: "/about",
});

// One Person per partner shown on the page (name, title and photo are all visible in the Leadership list).
const leadershipJsonLd = {
  "@context": "https://schema.org",
  "@graph": people.map((p) => ({
    "@type": "Person",
    "@id": `${absUrl("/about")}#${p.id}`,
    name: p.name,
    jobTitle: p.role,
    image: `${SITE_URL}${p.img}`,
    worksFor: orgRef,
  })),
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={leadershipJsonLd} />
      <PageHero img="/assets/about-atrium.jpg" title="About"
        lede="Founded in 1999, Banister International is an executive search and human capital advisory firm providing exceptional talent solutions to transformational, high-performing organizations.">
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
