import type { Metadata } from "next";
import { Img, NavyCta } from "@/components/ui";
import { STATE_OF_TA_REPORT } from "@/config/insights";
import { asset } from "@/lib/asset";
// Related reading and "also of interest" are hidden until there is content for them — restore with the commented
// <aside> below. The sidebar shows the report download card in the meantime.
// import { related } from "@/lib/content";

export const metadata: Metadata = { title: "The state of talent acquisition in professional services — Banister International" };

// Copy from the live page: https://banisterintus.com/the-state-of-talent-acquisition-in-professional-services/
const REPORT_FILENAME = "The-State-of-TA-in-Professional-Services_Banister-International.pdf";
const body = "m-0 text-[17px] leading-[1.8]";

const explores = [
  ["The current state of talent acquisition", "How technology, AI, data, and candidate expectations are reshaping talent acquisition, and how organizations are approaching strategic hiring, passive candidates, relationship capital, workforce planning, and leadership succession."],
  ["Five best practices of high-performing talent acquisition teams", "The practices that help organizations align talent acquisition with business strategy, proactively build relationships, build trust with candidates, measure hiring success beyond time-to-fill, and use technology effectively."],
  ["The future of talent acquisition", "How technology is changing the way organizations approach productivity, sourcing, and interviews, while strengthening rather than replacing human judgment in the hiring process."],
];

export default function ArticlePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-black">
        {/* The photo fills only the left of the hero and fades into the black behind the title. Below lg it spans the
            width under a flat dim so the title stays readable. */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-1/2">
          {/* LCP image: eager + high priority, never `preload` (see Img). */}
          <Img src="/assets/insight-state-of-ta.jpg" fill sizes="(min-width: 1024px) 50vw, 100vw" loading="eager" fetchPriority="high"
            className="object-cover object-[left_22%]" />
          <div className="absolute inset-0 bg-black/60 lg:bg-transparent lg:bg-[linear-gradient(90deg,rgba(0,0,0,0)_50%,#000_100%)]" />
        </div>
        <div className="site px-gutter relative flex justify-end py-[clamp(64px,8vw,112px)]">
          <div className="flex max-w-[560px] flex-col gap-4">
            <span className="text-[13px] font-semibold tracking-[.04em] text-teal">White Paper</span>
            <h1 className="m-0 text-[clamp(34px,4vw,54px)] leading-[1.1] font-bold tracking-[-.01em] text-pretty text-white">
              The state of talent acquisition in professional services
            </h1>
          </div>
        </div>
      </section>
      <section className="site px-gutter flex flex-wrap items-start gap-x-[72px] gap-y-12 pt-[clamp(48px,6vw,72px)] pb-[clamp(64px,7vw,96px)]">
        <article className="flex max-w-[720px] flex-[1_1_520px] flex-col gap-[22px]">
          <p className="m-0 text-[22px] leading-[1.45] font-bold text-navy">
            Insights from Banister International leadership and a seasoned talent acquisition leader on what is changing, what remains consistent, and where the industry is headed.
          </p>
          <p className={body}>
            The talent acquisition landscape is evolving every day. Advances in AI, data platforms, and sourcing techniques are reshaping how organizations measure success. While these advancements can support large-scale, entry-level bulk hiring, they are also clogging the supply chain, making it increasingly difficult to find the right candidates. AI can help improve the hiring process, but it can’t replace a high-touch, low-volume recruiting approach.
          </p>
          <p className={body}>
            The introduction of these new tools is no different from what happened when Monster and CareerBuilder arrived in the 1990s. Job seekers moved from newspaper listings to online job boards, and applicant volume exploded. The same issue presents itself today: more volume does not necessarily mean better candidates.
          </p>
          <p className={body}>
            Today, many candidates use AI to create “perfect” resumes. At the same time, some organizations use AI to screen candidates at the beginning of the hiring process. Qualified candidates are caught in the middle and are losing faith in the process. According to <em>Fortune</em>, hiring managers face their own challenges. Applicant pools are flooded with AI-generated applications, while scams involving fake candidates, including North Korean IT workers, have made it harder for companies to identify legitimate applicants. (<em>Fortune</em>, 2025; <em>Fortune</em>, 2026a; <em>Fortune</em>, 2026b)
          </p>
          <p className={body}>
            To better understand the current state of talent acquisition, Banister International’s leadership team shares insights, personal search stories, and lessons learned from the past thirty years. We also feature insights from a highly respected talent acquisition leader in the professional services industry on the future of talent acquisition.
          </p>
          <h2 className="m-0 mt-3 text-[clamp(22px,2vw,26px)] font-bold text-navy">This report explores</h2>
          <ol className="m-0 flex list-decimal flex-col gap-4 pl-6 text-[17px] leading-[1.7] marker:font-bold marker:text-navy">
            {explores.map(([title, text]) => (
              <li key={title}><strong className="text-navy">{title}:</strong> {text}</li>
            ))}
          </ol>
        </article>
        <aside className="flex flex-[0_1_340px] flex-col gap-[2px] lg:sticky lg:top-8">
          <div className="bg-navy text-white">
            <div className="flex flex-col gap-3 p-6">
              <span className="text-[12px] font-bold tracking-[.08em] text-gold uppercase">White paper</span>
              <span className="text-[19px] leading-[1.35] font-bold text-pretty">The state of talent acquisition in professional services</span>
              <span className="text-[14px] text-white/75">PDF · 10 pages</span>
              <a href={asset(STATE_OF_TA_REPORT)} download={REPORT_FILENAME}
                className="mt-2 flex items-center gap-[18px] self-start bg-gold px-[18px] py-3 text-[12.5px] font-bold tracking-[.06em] text-navy no-underline hover:bg-white hover:text-navy">
                DOWNLOAD THE FULL REPORT <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="bg-fog p-6">
            <div className="mb-2 text-[16px] font-bold text-navy">Have a search in mind?</div>
            <p className="m-0 mb-4 text-[14.5px] leading-[1.5]">Talk with a Banister partner about the role you need to fill.</p>
            <NavyCta href="/contact?aud=employer">SPEAK WITH A PARTNER</NavyCta>
          </div>
        </aside>
        {/*
        <aside className="flex flex-[0_1_300px] flex-col gap-[2px]">
          <div className="bg-fog p-6">
            <div className="mb-3 text-[16px] font-bold text-navy">Related reading</div>
            {related.map((r) => (
              <div key={r.title} className="flex flex-col gap-1 border-t border-[#d3d8dc] py-3">
                <span className="text-[12.5px] text-slate">{r.date}</span>
                <span className="text-[14.5px] leading-[1.45] font-semibold text-navy">{r.title}</span>
              </div>
            ))}
          </div>
          <div className="bg-[#d8dde3] p-6">
            <div className="mb-2 text-[16px] font-bold text-navy">Also of interest</div>
            <span className="text-[14.5px] leading-[1.5]">Explore our latest <a href="#">case studies</a> in manufacturing.</span>
          </div>
        </aside>
        */}
      </section>
    </>
  );
}
