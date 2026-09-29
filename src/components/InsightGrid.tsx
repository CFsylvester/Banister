import { GRID_3, type Insight, news as newsItems } from "@/lib/content";
import { Img, OutlineCta, Tags } from "./ui";

export default function InsightGrid({ items }: { items: Insight[] }) {
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
