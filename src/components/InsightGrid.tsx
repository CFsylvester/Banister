import { GRID_3, type Insight, news as newsItems } from "@/lib/content";
import { Img, OutlineCta, Tags } from "./ui";

/** "Our latest insight" vs "Our latest insights" — the heading follows how many insights are live. */
export const insightsHeading = (prefix: string, count: number) => `${prefix} insight${count === 1 ? "" : "s"}`;

export default function InsightGrid({ items }: { items: Insight[] }) {
  // A lone insight stretched across the 3-up grid becomes a full-width image, so it gets a side-by-side feature.
  if (items.length === 1) {
    const [a] = items;
    return (
      <div className="grid items-center gap-x-12 gap-y-6 md:grid-cols-2">
        <Img src={a.img} className="block aspect-[16/10] w-full object-cover" />
        <div className="flex flex-col gap-4">
          <Tags tags={a.tags} />
          <span className="text-[clamp(22px,2.2vw,28px)] leading-[1.3] font-bold text-pretty text-navy">{a.title}</span>
          <span className="text-[16px] leading-[1.6]">{a.dek}</span>
          <OutlineCta href={a.href} className="mt-2 px-4 py-2.5">LEARN MORE</OutlineCta>
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-x-8 gap-y-10" style={{ gridTemplateColumns: GRID_3 }}>
      {items.map((a) => (
        <div key={a.title} className="flex flex-col gap-4">
          <Img src={a.img} className="block aspect-[16/10] w-full object-cover" />
          <Tags tags={a.tags} />
          <span className="text-[19px] leading-[1.35] font-bold text-pretty text-navy">{a.title}</span>
          <span className="flex-1 text-[15px] leading-[1.6]">{a.dek}</span>
          <OutlineCta href={a.href}>LEARN MORE</OutlineCta>
        </div>
      ))}
    </div>
  );
}

export function NewsGrid({ items = newsItems }: { items?: typeof newsItems }) {
  return (
    <div className="grid gap-x-8 gap-y-10" style={{ gridTemplateColumns: GRID_3 }}>
      {items.map((a) => (
        <div key={a.title} className="flex flex-col gap-3.5">
          <Img src={a.img} className="block aspect-[16/10] w-full border border-fog object-cover" />
          <Tags tags={a.tags} />
          <span className="text-[18px] leading-[1.4] font-bold text-pretty text-navy">{a.title}</span>
          <span className="flex-1 text-[14px] text-slate">{a.date}</span>
          {/* [assumption] Newsroom items have no destination in the design yet — rendered as a non-link. */}
          <OutlineCta>LEARN MORE</OutlineCta>
        </div>
      ))}
    </div>
  );
}
