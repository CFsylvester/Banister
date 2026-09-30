// Site copy + data, transcribed from design/banister-v2.dc.html (renderVals). Bracketed strings are the
// design's own placeholders awaiting approved copy.

export type Tag = { t: string; bg: string; fg: string; bd: string };
export const tags = (list: string[]): Tag[] =>
  list.map((t, i) => (i === 0 ? { t, bg: "#ffc91e", fg: "#003f5e", bd: "#ffc91e" } : { t, bg: "transparent", fg: "#003f5e", bd: "#e8c65a" }));

export const ARTICLE_HREF = "/insights/state-of-talent-acquisition";

export const nav = [
  { href: "/services", label: "Services" },
  { href: "/industries", label: "Industries" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
  { href: "/contact", label: "Contact" },
];

// Homepage hero slides + stats now live in Contentful (contentful/seed/home.json). The rest of this file
// still feeds the not-yet-migrated pages.

export const quotes = [
  { text: "[Approved client testimonial — a specific outcome in the client’s own words, two or three sentences at most.]", who: "[Client name], [Title], [Company]" },
  { text: "[Second approved testimonial.]", who: "[Client name], [Title], [Company]" },
  { text: "[Third approved testimonial.]", who: "[Client name], [Title], [Company]" },
];

export type Insight = { img: string; tags: Tag[]; title: string; dek: string; href: string };
export const homeInsights: Insight[] = [
  { img: "/assets/operations.jpg", tags: tags(["White paper", "Professional services", "Talent acquisition"]), title: "The state of talent acquisition in professional services", dek: "Perspectives from executive search partners and talent acquisition leaders.", href: ARTICLE_HREF },
  { img: "/assets/insight-whiteboard.jpg", tags: tags(["Article", "HR leadership", "Workforce planning"]), title: "Why is HR the “cobbler’s children” in the world of talent acquisition?", dek: "HR built a whole sub-function around succession planning, workforce planning and people movement — then rarely applied it to itself.", href: ARTICLE_HREF },
  { img: "/assets/insight-hardhats.jpg", tags: tags(["Article", "[Topic]"]), title: "[Third article title]", dek: "[One-sentence summary.]", href: ARTICLE_HREF },
];
export const insights: Insight[] = [
  { ...homeInsights[0], img: "/assets/insight-greeting.jpg" },
  { ...homeInsights[1], img: "/assets/handshake-city.jpg" },
  { ...homeInsights[2], img: "/assets/insight-tablet.jpg" },
];
export const news = [
  { img: "/assets/duffy-alliance.jpg", tags: tags(["News", "Partnerships"]), title: "Banister International expands service offerings through strategic alliance with Duffy Group", date: "August 31, 2026" },
  { img: "/assets/hero-handshake.jpg", tags: tags(["News", "Legal search", "Partnerships"]), title: "Banister International launches strategic partnership with Shapiro Legal Search to introduce legal executive search", date: "May 4, 2026" },
  { img: "/assets/team-meeting.jpg", tags: tags(["News", "Executive search"]), title: "Banister International completes transformational general manager search project", date: "April 2, 2026" },
];
export const related = [
  { date: "July 2026", title: "[Research paper title]" },
  { date: "June 2026", title: "[Infographic title]" },
  { date: "May 2026", title: "[Article title]" },
];

export const services = [
  { title: "Executive search", dark: false, paras: ["Banister has a long-standing reputation for identifying and attracting exceptional senior talent, from Senior Director to C-suite and board level.", "Our network of proven leaders is built through relationships that span their careers. We use that market knowledge to connect clients with leaders who fit their strategy, culture and long-term vision."] },
  { title: "Next generation leadership search", dark: false, paras: ["A relationship-driven approach to finding the talent companies need for their next stage of growth.", "We work closely with organizations in transformation to identify next-generation leaders at every level, aligning talent with strategy to build the capabilities that change requires."] },
  { title: "Search & advisory services", dark: false, paras: ["Dedicated recruitment teams for high-volume hiring across sales, operations, customer service and other critical functions.", "Our structured project methodology lets organizations scale hiring quickly while keeping a consistent focus on candidate quality."] },
  { title: "Informed search", dark: true, paras: ["Through a strategic alliance with Duffy Group, we offer tailored talent acquisition on a flexible, hourly pricing model.", "The five-step Duffy Recruitment Research™ Advantage covers strategy, name generation, position promotion, candidate evaluation, and reporting."] },
];

export const drivers = [
  { img: "/assets/hex-quality.png", title: "Quality", body: "Every presented candidate has the stretch to do the role and the ability to be promoted to the next." },
  { img: "/assets/hex-execution.png", title: "Execution", body: "Technology-enabled tools overlaid with a hands-on, partner-managed search." },
  { img: "/assets/hex-speed.png", title: "Speed", body: "A search process that delivers initial candidates within 10 days of search origination." },
  { img: "/assets/hex-insights.png", title: "Insights", body: "Every search is led by a partner with at least 20 years of search experience." },
];

export const industries = [
  ["aerospace", "Aerospace, defense and automotive"], ["building-products", "Building products and HVAC"],
  ["construction", "Construction, real estate and building services"], ["consumer", "Consumer goods and retail"],
  ["education", "Education, training and coaching"], ["financial", "Financial services"],
  ["food", "Food, beverage and restaurant brands"], ["hospitality", "Hospitality and real estate"],
  ["insurance", "Insurance and managed care"], ["consulting", "Management consulting, accounting and professional services"],
  ["manufacturing", "Manufacturing, packaging, industrial and transportation"], ["private-equity", "Private equity and investment firms"],
  ["sport", "Sport, entertainment and associations"], ["technology", "Technology, media and telecommunications"],
].map(([k, name]) => ({ name, icon: `/assets/icon-${k}.png` }));

export const people = [
  { id: "patrick-sylvester", name: "Patrick Sylvester", role: "CEO and Founder", paras: [
    "Patrick founded Banister International in August 1999 and built it into an internationally respected search and consulting firm with operations across the United States, Europe and Asia. He serves as a strategic talent advisor to organizations navigating significant growth and transformation.",
    "He entered executive search in 1993 with Management Recruiters International, where he was the top-producing manager-owner for more than 15 consecutive years. He has since led more than 100 transformational projects and thousands of executive searches across multiple industries.",
    "Before his search career, Patrick served as a United States Naval Officer. He holds a BS in Economics, with concentrations in Finance and Entrepreneurial Management, from the Wharton School."] },
  { id: "tammie-do", name: "Tammie Do", role: "Senior Managing Partner", paras: [
    "Tammie brings more than 25 years of executive search experience and has been a driving force at Banister for over 15 years. She is recognized for strategic insight, long-standing executive relationships and consistently high-impact outcomes.",
    "At Management Recruiters International she became the firm’s #1-ranked female recruiter globally. She later founded Talent Resource Solutions, building it into a high-performing search platform known for speed, quality and execution.",
    "A recognized thought leader and sought-after speaker, Tammie is known for navigating complex hiring challenges and delivering strong retention outcomes."] },
  { id: "brian-haugh", name: "Brian Haugh", role: "Senior Managing Director", paras: [
    "Brian leads retained search engagements for legal leadership roles — Assistant General Counsel, General Counsel and Chief of Staff — as well as accounting and finance leadership.",
    "In 2006 he founded Veridian National Search, which specializes in Big Four candidates and remains active today. He is also a Senior Partner at Shapiro Legal Search, with clients ranging from Big Law, Am Law 200, boutique and regional firms to Fortune 1000 in-house teams.",
    "Brian spent his first ten years on Marine Corps bases from Anaheim to Quantico, and earned his accounting degree at the University of Illinois Urbana-Champaign."] },
  { id: "james-mcmahon", name: "James McMahon", role: "Senior Managing Director", paras: [
    "James leads retained search engagements for legal leadership roles and places attorneys at every level — from lateral partner moves that require discretion to associate searches that demand speed and precision.",
    "He is a Partner at Shapiro Legal Search, a member of the Sanford Rose Associates network, and has been a trusted voice in recruitment for almost 20 years, working with firms from global Big Law to specialized boutiques.",
    "A University of Illinois alumnus, James was born and raised in Chicago."] },
].map((p) => ({ ...p, img: `/assets/${p.id}.jpg` }));

export const siteMap = [
  { title: "Services", href: "/services", links: ["Executive search", "Next generation leadership", "Search & advisory", "Informed search"].map((t) => ({ t, href: "/services" })) },
  { title: "Firm", href: "/about", links: [{ t: "About", href: "/about" }, { t: "Leadership", href: "/about" }, { t: "Industries", href: "/industries" }] },
  { title: "Insights", href: "/insights", links: [{ t: "Latest insights", href: "/insights" }, { t: "Newsroom", href: "/insights" }, { t: "White paper", href: ARTICLE_HREF }] },
  { title: "Contact", href: "/contact", links: [{ t: "For employers", href: "/contact?aud=employer" }, { t: "For candidates", href: "/contact?aud=candidate" }] },
];

// Shared responsive grid tracks from the design (4-up → 2-up below 760px, 3-up → 1-up below 640px).
export const GRID_4 = (gap: number) =>
  `repeat(auto-fit,minmax(min(calc((100% - ${gap}px)/2),max(calc((100% - ${gap * 3}px)/4),calc((760px - 100%)*999))),1fr))`;
export const GRID_3 = "repeat(auto-fit,minmax(min(100%,max(calc((100% - 64px)/3),calc((640px - 100%)*999))),1fr))";
