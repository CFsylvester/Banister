import Link from "next/link";
import HeroSlides from "@/components/HeroSlides";
import InsightGrid from "@/components/InsightGrid";
import Quotes from "@/components/Quotes";
import Stats from "@/components/Stats";
import { tags } from "@/lib/content";
import { mapHome } from "@/lib/cms/map/home.ts";
import { Headline } from "@/lib/cms/richtext";
import { ARTICLE_ROUTES } from "@/lib/cms/routes";
import { getHomePage, getInsightArticles } from "@/lib/cms/source";

// All homepage content comes from Contentful at build time (specs/001-contentful-cms, Slice H).
export default async function Home() {
  const [homeEntry, articles] = await Promise.all([getHomePage(), getInsightArticles()]);
  const home = mapHome(homeEntry, articles, ARTICLE_ROUTES);
  for (const w of home.warnings) console.warn(`[cms] ${w}`);

  return (
    <>
      <section style={{ background: "linear-gradient(180deg,#003f5e 0%,#003f5e 62%,#0b5f7a 86%,#1f9fb0 100%)" }}>
        <div className="site px-gutter pt-2">
          <div className="relative flex min-h-[clamp(360px,44vw,560px)] items-end overflow-hidden border-b-4 border-teal">
            <HeroSlides slides={home.hero.slides} />
            <div className="relative flex w-full flex-col gap-[clamp(20px,2.4vw,32px)] pb-[clamp(18px,2vw,28px)]">
              <div className="relative mr-[clamp(24px,5vw,56px)] px-[clamp(20px,2.6vw,32px)] py-[clamp(18px,2.4vw,30px)]">
                <div className="absolute inset-0 bg-[#00324d] mix-blend-multiply" />
                <div className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
                  <h1 className="m-0 text-[clamp(44px,6.4vw,92px)] leading-[1.05] font-bold tracking-[-.01em] text-white">
                    <Headline doc={home.hero.headline} />
                  </h1>
                  <Link href={home.hero.ctaHref}
                    className="flex flex-none cursor-pointer items-center gap-[18px] bg-gold px-6 py-4 text-[13px] font-extrabold tracking-[.06em] text-navy no-underline hover:bg-white hover:text-navy">
                    {home.hero.ctaLabel} <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="site px-gutter grid grid-cols-[repeat(auto-fit,minmax(min(100%,420px),1fr))] gap-x-16 gap-y-6 pt-[clamp(48px,6vw,80px)]">
        <p className="m-0 text-[clamp(20px,1.9vw,25px)] leading-[1.5] text-pretty text-navy">
          {home.intro.lead}
        </p>
        <p className="m-0 text-[16px] leading-[1.75] text-pretty">
          {home.intro.body}
        </p>
      </section>

      <Stats heading={home.stats.heading} stats={home.stats.items} />

      <Quotes heading={home.testimonials.heading} quotes={home.testimonials.items} className="mt-[clamp(72px,8vw,112px)]" />

      <section className="site px-gutter py-[clamp(72px,8vw,112px)]">
        <h2 className="m-0 mb-8 text-[clamp(26px,2.4vw,32px)] font-bold text-navy">{home.insights.heading}</h2>
        <InsightGrid items={home.insights.cards.map((c) => ({ ...c, tags: tags(c.tags) }))} />
      </section>
    </>
  );
}
