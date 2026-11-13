import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Img, NavyCta } from "@/components/ui";
import { STATE_OF_TA_REPORT } from "@/config/insights";
import JsonLd from "@/components/JsonLd";
import { asset } from "@/lib/asset";
import { absUrl, orgRef, SITE_URL } from "@/lib/seo";
// Related reading and "also of interest" are hidden until there is content for them — restore with the commented
// <aside> below. The sidebar shows the report download card in the meantime.
// import { related } from "@/lib/content";

export const metadata: Metadata = pageMetadata({
  title: "State of Talent Acquisition | Banister International",
  description: "A white paper from Banister International leadership and a talent acquisition leader on what is changing in hiring, what is not, and where it is headed.",
  path: "/insights/state-of-talent-acquisition",
  type: "article",
});

// The intro is the live page's copy: https://banisterintus.com/the-state-of-talent-acquisition-in-professional-services/
// Everything from "The current state of talent acquisition" down is the full text of the PDF (public/reports/), lightly
// copy-edited for grammar only, so search and AI answer engines can quote the report's sections, not just its summary.
// Keep the two in step when the report changes.
const REPORT_FILENAME = "The-State-of-TA-in-Professional-Services_Banister-International.pdf";
const body = "m-0 text-[17px] leading-[1.8]";
const h2 = "m-0 mt-8 scroll-mt-8 text-[clamp(24px,2.2vw,30px)] leading-[1.2] font-bold text-navy";
const h3 = "m-0 mt-3 text-[clamp(19px,1.6vw,22px)] leading-[1.3] font-bold text-navy";
// The live page's article:published_time (checked 2026-11-13).
const PUBLISHED = "2026-10-01";

// The report's own "Contributors" list (last page of the PDF), shown in the Contributors section below. The three
// Banister partners reuse the Person @ids from /about/.
const partner = (id: string, name: string, jobTitle: string) =>
  ({ "@type": "Person", "@id": `${absUrl("/about")}#${id}`, name, jobTitle, url: absUrl("/about"), worksFor: orgRef });
const authors = [
  partner("patrick-sylvester", "Patrick Sylvester", "CEO and Founder"),
  partner("james-mcmahon", "James McMahon", "Senior Managing Director"),
  partner("brian-haugh", "Brian Haugh", "Senior Managing Director"),
  { "@type": "Person", name: "Larry Brand", jobTitle: "Operating Partner and HR Leader", worksFor: { "@type": "Organization", name: "One Rock Capital Partners" } },
];

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The state of talent acquisition in professional services",
  description: "Insights from Banister International leadership and a seasoned talent acquisition leader on what is changing, what remains consistent, and where the industry is headed.",
  image: `${SITE_URL}/assets/insight-state-of-ta.jpg`,
  datePublished: PUBLISHED,
  author: authors,
  publisher: orgRef,
  mainEntityOfPage: absUrl("/insights/state-of-talent-acquisition"),
};

const explores = [
  ["current-state", "The current state of talent acquisition", "How technology, AI, data, and candidate expectations are reshaping talent acquisition, and how organizations are approaching strategic hiring, passive candidates, relationship capital, workforce planning, and leadership succession."],
  ["best-practices", "Five best practices of high-performing talent acquisition teams", "The practices that help organizations align talent acquisition with business strategy, proactively build relationships, build trust with candidates, measure hiring success beyond time-to-fill, and use technology effectively."],
  ["future", "The future of talent acquisition", "How technology is changing the way organizations approach productivity, sourcing, and interviews, while strengthening rather than replacing human judgment in the hiring process."],
];

export default function ArticlePage() {
  return (
    <>
      <JsonLd data={articleJsonLd} />
      <section className="relative overflow-hidden bg-black">
        {/* The photo fills only the left of the hero and fades into the black behind the title. Below lg it spans the
            width under a flat dim so the title stays readable. */}
        <div className="absolute inset-y-0 left-0 w-full lg:w-1/2">
          {/* LCP image: eager + high priority (see Img). */}
          <Img src="/assets/insight-state-of-ta.jpg" fill sizes="(min-width: 1024px) 50vw, 100vw" loading="eager" fetchPriority="high"
            className="object-cover object-[left_22%]" />
          <div className="absolute inset-0 bg-black/60 lg:bg-transparent lg:bg-[linear-gradient(90deg,rgba(0,0,0,0)_50%,#000_100%)]" />
        </div>
        <div className="site px-gutter relative flex justify-end py-[clamp(64px,8vw,112px)]">
          <div className="flex max-w-[560px] flex-col gap-4">
            <span className="text-[13px] font-semibold tracking-[.04em] text-teal">
              White Paper · <time dateTime={PUBLISHED}>October 1, 2026</time>
            </span>
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
            {explores.map(([id, title, text]) => (
              <li key={id}><a href={`#${id}`} className="font-bold text-navy">{title}</a>: {text}</li>
            ))}
          </ol>

          <h2 id="current-state" className={h2}>The current state of talent acquisition</h2>
          <p className={body}>
            In the past decade, talent acquisition has become increasingly technology-driven, evolving into a function measured by metrics such as time-to-fill and cost-per-hire. While these metrics provide valuable insight into efficiency, they often overlook the most important measure of all: the value a hire brings to the organization. As a result, the long-term impact of a hire, which has always been difficult to quantify, can become secondary to the speed and cost of making it.
          </p>
          <p className={body}>
            Now more than ever, there is a surplus of tools to support the hiring process, including AI, data platforms, LinkedIn automation, and new sourcing techniques. These tools can create efficiency, but they can also create noise. Candidates tell us they are receiving more messages, emails, texts, calls, etc., than ever before, and it is hard to tell which opportunities are legitimate. Organizations, meanwhile, are stuck monitoring a slew of candidates who aren’t even viable, because these tools give nearly every candidate a “perfect” resume.
          </p>
          <p className={body}>
            The biggest challenge for talent acquisition moving forward is uncertainty, which can slow decision-making even when there is an urgent need to hire. Organizations are balancing new advancements with caution while continuing to evaluate how changing market conditions and evolving technologies will affect workforce planning and actual headcount needs.
          </p>

          <h3 className={h3}>The new talent landscape</h3>
          <p className={body}>
            Many organizations are becoming more selective with hiring while continuing to seek access to top talent. They remain cautious about adding headcount but still prioritize candidates who can generate revenue, bring specialized expertise, or provide a clear strategic advantage. Organizations are starting to use AI to automate high-volume, entry-level recruiting. This lets talent acquisition teams spend more time on strategic hiring, building candidate relationships, and reaffirming partnerships with recruiting firms that can identify high-potential talent.
          </p>
          <p className={body}>
            Candidates aren’t more selective now because the market has drastically changed; they’re more selective because they can now verify information in five minutes that once required a warm introduction to uncover. Ten years ago, a law firm partner evaluating a lateral move had only the firm’s pitch, a Chambers ranking, and what their personal network knew. Information was scarce, so the firm did most of the persuading. Now there is more information at our fingertips than ever before.
          </p>
          <p className={body}>
            Two-way relationships create long-term competitive advantages. However, many organizations are slow to give feedback and forget to sell themselves, because they believe they are the prize.
          </p>
          <p className={body}>
            We saw this firsthand with a client who had been interviewing a practice group for over six months. Toward the end of the process, the practice group received an offer from another firm (not through us), and we immediately informed our client. Despite knowing about the other offer, our client took more than three weeks to secure the necessary approvals. The practice group didn’t feel prioritized and accepted the other offer. The client lost a $2MM fee because it underestimated the group’s value. Within 30 days, a smaller, less-known firm recruited the practice group and acquired $37MM in revenue.
          </p>

          <h3 className={h3}>Passive candidates</h3>
          <p className={body}>
            Most of the “desired” candidates are not actively looking for new opportunities. The challenge, therefore, is not only identifying who fits an opening, but also making a compelling enough case for someone to leave their current situation. This is why strong communication skills, accurate candidate data, and active relationship building are the most essential elements of recruiting.
          </p>
          <p className={body}>
            Too often, recruiting has become transactional. If a candidate does not fit a particular role, the interaction usually ends once the recruiter decides they are not useful to the recruiter in that instance. The candidate may also never hear from that recruiter again, even during an active interview process. This is what separates good recruiters from transactional ones. A good recruiter keeps communicating and keeps the candidate informed, whatever feedback comes back from the hiring manager. AI may continue to make candidate data more accessible, but it cannot replace the personal relationships that make candidates willing to consider a new opportunity. Recruiters who fail to capitalize on their ability to be personal, responsive, and relationship-driven risk becoming replaceable by AI.
          </p>

          <h3 className={h3}>Relationship capital</h3>
          <p className={body}>
            The strongest talent acquisition teams aren’t necessarily those with the largest recruiting teams. They are the ones who have invested in building real relationships with prior candidates, which gives them broader awareness of who to contact when a new opportunity arises.
          </p>
          <p className={body}>
            Companies without relationships are nothing more than a CRM. Relationships require trust, and trust unlocks access to better information. When a two-way relationship is in place, both the candidate and the client are more likely to be candid about motivations, concerns, timing, compensation, and potential obstacles — all information that determines a successful search.
          </p>
          <p className={body}>
            We saw the value of relationship capital firsthand when a firm where we had previously placed a partner reached out before the search was even approved. Its senior real estate partner was planning to retire in 18 months but did not want the retirement made public, and the firm needed to identify a successor who could ultimately absorb his book of business. The search was never public and was conducted entirely confidentially. A few months earlier, we had spoken with a partner at a competing firm who was not actively looking for a new opportunity but had said he would be open to conversations if the opportunity was the right fit.
          </p>
          <p className={body}>
            Neither side would have found the other without the relationships that were already in place. The firm could not advertise the position without revealing the planned retirement, and the candidate was not actively exploring new opportunities. Our existing relationships allowed us to connect the two discreetly and proactively.
          </p>
          <p className={body}>
            Reputation alone might open the door in a search, but it rarely closes the deal. It creates credibility and attention, but on its own it rarely buys actual trust. Candidates still want the full picture: what the day-to-day work looks like, who they will be working with, what the culture is like, and what the opportunity means for their career.
          </p>

          <h3 className={h3}>Workforce planning</h3>
          <p className={body}>
            Companies should start thinking more strategically about future talent needs rather than waiting to recruit when a role becomes open. The best teams regularly evaluate where they are vulnerable, where succession planning is needed, and where technology may change the type of talent required. Waiting until there is an urgent vacancy puts organizations at a disadvantage.
          </p>
          <p className={body}>
            For example, a mid-sized firm had one attorney handling all its ERISA and employee benefits work. She was the only attorney who could do this work, and she supported three of the firm’s largest corporate clients. She gave notice and was gone in two weeks. The firm began the search immediately, but it took over two months to get a qualified candidate to the offer stage and another two weeks to get the offer approved. During that two-week approval window, the candidate accepted another offer, and the firm had to restart the search.
          </p>
          <p className={body}>
            By the time the position was filled, the search had been open for six months. During those six months, two of the three clients moved their benefits work to another firm. The firm hadn’t done anything wrong; it just hadn’t thought about the effect on the business unit if that role became vacant unexpectedly. Without plans for critical roles, organizations can quickly find themselves reacting to a talent gap too late.
          </p>

          <h3 className={h3}>Leadership succession</h3>
          <p className={body}>
            Many companies wait too long to understand their future talent needs, and many don’t focus on the talent they already have in house. Leadership succession should be an ongoing process that includes identifying future leaders, developing internal talent, and knowing where external talent may be needed.
          </p>
          <p className={body}>
            For example, we recently placed a candidate with a client we have worked with for more than 15 years. The hiring manager was intentional about looking beyond the immediate role, identifying someone who could be promoted within 12 to 18 months. Just as importantly, the candidate was expected to bring expertise that could elevate the existing team by training and developing employees in their current roles. That ability to strengthen the broader team was a key consideration in the hiring decision.
          </p>

          <h2 id="best-practices" className={h2}>Five best practices of high-performing talent acquisition teams</h2>
          <p className={body}>
            Organizations with strong talent acquisition teams move with discipline and urgency. Organizations that struggle to hire strong talent often make two common mistakes. First, they become too invested in one candidate too early in the hiring process and stop considering other options; if the preferred candidate chooses another opportunity, the search effectively starts over. Second, they allow the hiring process to lose momentum. Delays can cause candidates to question the organization’s level of interest and commitment, weakening engagement on both sides.
          </p>
          <p className={body}>
            Despite the tools and data that have advanced the mechanics of recruiting, the fundamentals of search have remained consistent, regardless of an organization’s size or industry. At its core, search is built on reputation, trust, and relationships. High-performing talent acquisition teams follow five practices.
          </p>
          <ol role="list" className="m-0 flex list-none flex-col gap-[22px] p-0">
            <li className="flex flex-col gap-[22px]">
              <h3 className={h3}>1. Align talent acquisition with business strategy</h3>
              <p className={body}>
                The highest-performing talent acquisition teams do more than just fill the position. They influence workforce strategy by understanding the actual business challenge the organization is trying to solve and aligning the right talent to address it. Every successful search should begin with the business challenge, not with finding someone who matches the job description. This alignment between talent and business needs leads to stronger partnerships with leadership, stronger talent, and greater long-term impact for the organization.
              </p>
              <p className={body}>
                Specialization creates better outcomes. Deep industry knowledge and functional expertise will hold the most capital. High-performing talent acquisition teams build their teams around experts in the specific industries and functions they serve. This allows them to better understand the market, identify relevant talent, and assess candidates against the specific challenges and requirements of an organization.
              </p>
            </li>
            <li className="flex flex-col gap-[22px]">
              <h3 className={h3}>2. Proactive relationship building</h3>
              <p className={body}>
                Rather than waiting for the “perfect” candidate to appear, the best recruiters are proactive and build relationships daily, before an opportunity arises. They understand that even if a candidate is not the right fit for the open mandate and might not bring revenue in that instance, the conversation can create value in the future. Building these relationships gives the recruiter crucial information about the candidate’s career goals, aspirations, and geographic preferences for future searches.
              </p>
              <p className={body}>
                The best recruiters track candidates over long periods of time, keep up with their LinkedIn activity, and continuously update their database. Candidates need to be ready to make the move, but proactively building and fostering relationships over time can result in an effective long-term talent pipeline.
              </p>
              <p className={body}>
                The fundamentals of recruiting have not changed. The goal is still finding the best way to stand out to candidates, whether that happens through a call, text, email, LinkedIn, or a referral. Regardless of how a candidate’s attention is won, recruiting will always stem from a genuine connection.
              </p>
            </li>
            <li className="flex flex-col gap-[22px]">
              <h3 className={h3}>3. Build trust</h3>
              <p className={body}>
                Trust remains the foundation of search. It’s critical to communicate and work hand in hand with candidates. The best organizations move candidates through the hiring process transparently. They communicate clearly, provide timely feedback, and make candidates feel wanted, valued, and heard.
              </p>
              <p className={body}>
                Employer reputation plays a significant role in a candidate’s decision to accept a position. According to LinkedIn Talent Solutions, 96% of candidates research a potential employer’s reputation before switching jobs. A prestigious name and a higher compensation model cannot always overcome a poor reputation. (LinkedIn, 2026)
              </p>
              <p className={body}>
                We saw this firsthand with a senior real estate associate who had two offers. The first was from a highly ranked national firm, with $40K more in base compensation, a 2,000-hour requirement, and a compensation structure in which bonus eligibility started above target. The second was from a mid-sized regional firm, with a lower base salary, a 1,850-hour requirement with pro bono work counting toward it, and credit for work she originated.
              </p>
              <p className={body}>
                She chose the second offer because of something that happened during the larger firm’s interview process. There, three different people described the practice group differently, and no one could tell her to whom she would report. At the smaller firm, the partner she would work with walked her through his book of business, showed her which clients she would be taking over, and explained the matters she would be responsible for if hired.
              </p>
              <p className={body}>
                The smaller firm could clearly articulate the candidate’s future at the firm, while the larger firm could not. However, the larger firm assumed its reputation and higher compensation would outweigh the candidate’s interview experience.
              </p>
            </li>
            <li className="flex flex-col gap-[22px]">
              <h3 className={h3}>4. Measure success beyond time-to-fill</h3>
              <p className={body}>
                Many organizations evaluate their internal talent acquisition teams and external recruiting partners primarily on time-to-fill. While speed is important, especially as a vacant role creates anxiety and pressure across the business unit, a fast hire does not always mean the right hire. Organizations should focus on the metrics that reflect quality, speed, and long-term outcomes. The goal is not simply to track activity, but to understand what is driving success and where the process may be creating unnecessary obstacles.
              </p>
              <p className={body}>
                Success should be measured across the full hiring process: time to offer, offer-to-acceptance ratio, candidate experience, counteroffers, and retention.
              </p>
            </li>
            <li className="flex flex-col gap-[22px]">
              <h3 className={h3}>5. Stay proactive with technology advancements</h3>
              <p className={body}>
                Great leaders understand how to adopt new technology proactively without losing sight of the original practices that drive successful recruitment.
              </p>
              <p className={body}>
                Great recruiters use AI as another tool in their toolbox. They use it to help identify potential prospects, organize data, record and summarize candidate calls, research target markets, and maintain data hygiene. With these tasks taken care of, recruiters can focus on what they do best: building new relationships.
              </p>
            </li>
          </ol>

          <h2 id="future" className={h2}>Looking ahead: the future of talent acquisition</h2>
          <p className={body}>
            The future of talent acquisition will likely be shaped by the combination of technology, relationships, and long-term workforce strategy. Technology will continue to change how organizations identify, engage, and evaluate talent, but the fundamentals of recruiting remain the same. While new technology may create new efficiencies in recruiting, the importance of building authentic relationships will never be replaced. Companies are now expected to use these technological advancements, as significant investments are being made in tools and teams designed to drive productivity, reduce headcount where applicable, and increase profitability. As Hisayuki Idekoba, CEO of Indeed, explained, he hopes that “all of recruiters’ manual tasks will be automated” within five years. “AI should take on more of that work so recruiters can get back to building connections with the right match,” he said. (<em>Fortune</em>, 2026)
          </p>
          <p className={body}>
            These changes are already influencing how organizations approach the talent landscape. To better understand how they are playing out, we spoke with Larry Brand, a seasoned talent acquisition leader and Operating Partner at One Rock Capital Partners. Brand shares his perspectives on the future of talent acquisition, including how organizations are adapting to changing technology, evolving candidate expectations, and new approaches to productivity, sourcing, and the interview process.
          </p>
          <figure className="m-0 flex flex-col gap-[22px] border-l-4 border-gold pl-6">
            <blockquote className="m-0 flex flex-col gap-[22px]">
              <h3 className={h3}>Using new tools to improve productivity</h3>
              <p className={body}>
                One of the most significant benefits of using AI has been the amount of time it saves on administrative tasks, analysis, and modeling. AI can’t produce the final product, but it gives a strong starting point and allows our teams to run initial scenarios and analyze data much more efficiently and quickly.
              </p>
              <p className={body}>
                We also use AI for development and modeling around customer behavior, which has been helpful in identifying early signs that we may be at risk of losing a customer. This allows us to intervene earlier in the process, rather than waiting until the customer has already made the decision to leave.
              </p>
              <h3 className={h3}>Accelerating the sourcing process</h3>
              <p className={body}>
                LinkedIn Recruiter has incorporated new AI tools into its recruiter seats that support our hiring process. We’re seeing more recruiters use those tools to identify potential candidates for job searches and improve candidate matching. While these candidates may not always be the exact match, this technology provides a strong starting point and produces an initial slate of potential candidates for review in three to four days. Previously, it would usually take five to 10 days to see an initial slate of candidates.
              </p>
              <h3 className={h3}>The interview process</h3>
              <p className={body}>
                Our hiring team is now on the lookout for candidates who may be using AI to prepare for interviews, especially as we are conducting more first-round interviews remotely. Sometimes we come across candidates who seemed like a great fit during the virtual interview, but as they advance to the next round and we go much deeper with them, we’re uncertain how they even made it to the second round. We’re looking for certain buzzwords or highly polished answers that go beyond the candidate’s level of knowledge. We’re also paying closer attention to whether candidates possess the skills and qualifications listed on their resumes, as we have been seeing these discrepancies more frequently.
              </p>
              <p className={body}>
                Interview recording and note-taking platforms have helped my team and me with the hiring process. I no longer have to keep looking down to take notes during an interview, which lets me give my full attention to the candidate and get through all my questions while AI captures and organizes the conversation. Later, I can use that information to compare multiple candidates and have AI identify where candidates are strong and where they may have gaps.
              </p>
              <p className={body}>
                We’re not using AI to make the hiring decision. We’re using it to strengthen our hiring decision.
              </p>
            </blockquote>
            <figcaption className="text-[15px] font-semibold text-slate">— Larry Brand, Operating Partner, One Rock Capital Partners</figcaption>
          </figure>

          <h2 id="conclusion" className={h2}>Conclusion</h2>
          <p className={body}>
            Even with the advancement of technology, which is inevitable, most of an organization’s crucial hires are confidential and can’t be filled with accessible data alone. You can’t rely on posting the job or searching a database to find the right person. It comes down to relationships that have been built over years.
          </p>
          <p className={body}>
            Technology can help us find and research candidates, but it can’t replace picking up the phone and calling someone who already knows you, trusts you, and is willing to have a confidential conversation. At Banister International, our CEO has more than 10,000 contacts in his phone and has kept the same phone number since he started his recruiting career in 1993. Just last month, a candidate he placed 20 years ago texted him to ask for help with his next CEO role.
          </p>
          <p className={`${body} font-bold text-navy`}>Relationships are the foundation of recruiting.</p>

          <h2 id="contributors" className={h2}>Contributors</h2>
          <ul className="m-0 flex list-disc flex-col gap-2 pl-6 text-[17px] leading-[1.7]">
            <li>Larry Brand, Operating Partner and HR Leader, One Rock Capital Partners</li>
            <li><Link href="/about/" className="text-navy">Patrick Sylvester</Link>, CEO and Founder, Banister International</li>
            <li><Link href="/about/" className="text-navy">James McMahon</Link>, Senior Managing Director, Banister International</li>
            <li><Link href="/about/" className="text-navy">Brian Haugh</Link>, Senior Managing Director, Banister International</li>
          </ul>
          <p className="m-0 text-[15px] leading-[1.6] text-slate">
            Editorial and design: Grace Sylvester, Engagement Manager, Banister International; Delilah Zak, Delilah Zak Design.
          </p>

          <h2 id="sources" className={h2}>Sources</h2>
          <ul className="m-0 flex list-disc flex-col gap-2 pl-6 text-[15px] leading-[1.6]">
            <li><em>Fortune</em>, “Indeed CEO says the job market is stuck in a ‘vicious cycle’ if 1,000 qualified candidates can’t get hired: ‘Something’s wrong,’” September 21, 2026.</li>
            <li>LinkedIn, <em>Future of Talent Report: Beyond Hiring: The Rise of Talent Orchestration</em>, 2026.</li>
          </ul>
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
