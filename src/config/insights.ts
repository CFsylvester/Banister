import { ARTICLE_HREF, type Insight, tags } from "@/lib/content";

// The full white paper behind the live insight — the same PDF the current site links from
// https://banisterintus.com/the-state-of-talent-acquisition-in-professional-services/ ("DOWNLOAD FULL REPORT").
export const STATE_OF_TA_REPORT = "/reports/the-state-of-talent-acquisition-in-professional-services.pdf";

// The insights the site shows, newest first. Set `live: false` to hold one back until its article exists.
// One live insight renders as a single feature ("Our latest insight"); two or more render as the card grid.
// `listImg` swaps the image on the /insights page; the homepage uses `img`.
type InsightEntry = Insight & { live: boolean; listImg?: string };

export const insightsConfig: InsightEntry[] = [
  {
    live: true,
    img: "/assets/insight-state-of-ta.jpg",
    listImg: "/assets/insight-greeting.jpg",
    tags: tags(["White paper", "Professional services", "Talent acquisition"]),
    title: "The state of talent acquisition in professional services",
    dek: "Perspectives from executive search partners and talent acquisition leaders.",
    href: ARTICLE_HREF,
  },
  {
    live: false,
    img: "/assets/insight-whiteboard.jpg",
    listImg: "/assets/handshake-city.jpg",
    tags: tags(["Article", "HR leadership", "Workforce planning"]),
    title: "Why is HR the “cobbler’s children” in the world of talent acquisition?",
    dek: "HR built a whole sub-function around succession planning, workforce planning and people movement — then rarely applied it to itself.",
    href: ARTICLE_HREF,
  },
  {
    live: false,
    img: "/assets/insight-hardhats.jpg",
    listImg: "/assets/insight-tablet.jpg",
    tags: tags(["Article", "[Topic]"]),
    title: "[Third article title]",
    dek: "[One-sentence summary.]",
    href: ARTICLE_HREF,
  },
];

const live = insightsConfig.filter((i) => i.live);
const toInsight = (i: InsightEntry, img: string): Insight => ({ img, tags: i.tags, title: i.title, dek: i.dek, href: i.href });

export const homeInsights: Insight[] = live.map((i) => toInsight(i, i.img));
export const insights: Insight[] = live.map((i) => toInsight(i, i.listImg ?? i.img));
