import HeroSlides from "@/components/HeroSlides";
import InsightGrid from "@/components/InsightGrid";
import Quotes from "@/components/Quotes";
import Stats from "@/components/Stats";
import { homeInsights, quotes, stats } from "@/lib/content";
import { mapHero } from "@/lib/cms/map/hero.ts";
import { HeroHeadline } from "@/lib/cms/richtext";
import { getPage } from "@/lib/cms/source";

// The hero comes from Contentful (page → hero) at build time. Everything below it is still code copy until
// the owner's `page.blocks` types are built (specs/001-contentful-cms, Slice H).
export default async function Home() {
  const hero = mapHero(await getPage());

  return (
    <>
      <section style={{ background: "linear-gradient(180deg,#003f5e 0%,#003f5e 62%,#0b5f7a 86%,#1f9fb0 100%)" }}>
        <div className="site px-gutter pt-2">
          <div className="relative flex min-h-[clamp(360px,44vw,560px)] items-end overflow-hidden border-b-4 border-teal">
            <HeroSlides slides={hero.media.images} />
            <div className="relative flex w-full flex-col gap-[clamp(20px,2.4vw,32px)] pb-[clamp(18px,2vw,28px)]">
              <div className="relative mr-[clamp(24px,5vw,56px)] px-[clamp(20px,2.6vw,32px)] py-[clamp(18px,2.4vw,30px)]">
                <div className="absolute inset-0 bg-[#00324d] mix-blend-multiply" />
                <div className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
                  <HeroHeadline doc={hero.headline} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site px-gutter grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-x-16 gap-y-6 pt-[clamp(48px,6vw,80px)]">
        <p className="m-0 text-[clamp(20px,1.9vw,25px)] leading-[1.5] text-pretty text-navy">
          Founded in 1999, Banister International is a human capital advisory firm delivering high-impact talent solutions to transformational organizations.
        </p>
        <p className="m-0 text-[16px] leading-[1.75] text-pretty">
          We specialize in executive search, next-generation leadership, search and advisory projects, and interim leadership. Every engagement uses a branded search approach that tells the client’s story, led by one dedicated Client Engagement Partner from start to finish.
        </p>
      </section>

      <Stats heading="Our track record" stats={stats} />

      <Quotes heading="What our clients are saying" quotes={quotes} className="mt-[clamp(72px,8vw,112px)]" />

      <section className="site px-gutter py-[clamp(72px,8vw,112px)]">
        <h2 className="m-0 mb-8 text-[clamp(26px,2.4vw,32px)] font-bold text-navy">Our latest insights</h2>
        <InsightGrid items={homeInsights} />
      </section>
    </>
  );
}
