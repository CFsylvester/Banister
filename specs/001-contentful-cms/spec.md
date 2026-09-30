# Feature Specification: Editor-managed site content (headless CMS)

**Feature Branch**: `001-contentful-cms`

**Created**: 2026-09-30

**Status**: Draft

**Input**: User description: "Connect the Banister website to a brand-new Contentful space so editors control
EVERYTHING on the site — every page's copy and images, lists, article pages as real routes, contact and
newsletter copy, header/footer navigation, per-page SEO. Code keeps only layout, animation and form behavior.
New, empty space; model authored as reviewed migrations run in a sandbox first, then seeded from the current
site copy. Content fetched at build time so the site stays host-agnostic; hosting/publishing is out of scope.
Pixel parity must hold with the seeded content. Secrets via env, never committed."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A fresh content space reproduces today's site exactly (Priority: P1)

The site owner creates a new, empty content space and runs the provided setup. The content structure is
created from reviewed, versioned change scripts (applied to a throwaway sandbox copy first), then filled with
the site's current copy and images. The site built from that content is indistinguishable from the site
today.

**Why this priority**: Everything else depends on it. It proves the content structure covers the whole site
and that moving content out of the code changed nothing a visitor can see.

**Independent Test**: Against a brand-new space: run setup (structure → seed), build the site from the
space, and run the design-fidelity checks. Delivers value on its own: the site becomes editable with zero
visual change.

**Acceptance Scenarios**:

1. **Given** an empty space and the owner's credentials in the environment, **When** the structure scripts
   run, **Then** they are applied to a sandbox environment first, the owner sees a plain-language summary of
   each change, and nothing reaches the main environment without the owner's explicit approval.
2. **Given** the structure is in place, **When** the seed step runs, **Then** every page's copy, image,
   list item, navigation link and SEO field from today's site exists as published content.
3. **Given** the seeded space, **When** the site is built, **Then** all 7 pages at all 5 checked widths and
   all 10 checked interactive states match the approved design with 0% drift at the 0.1% threshold.
4. **Given** the seed step has already run, **When** it is run again, **Then** it does not create
   duplicates.

---

### User Story 2 - An editor changes any existing text or image (Priority: P2)

An editor opens the content space, edits a headline, paragraph, statistic, person's bio, service
description, industry name, testimonial, navigation label, footer link, contact copy, newsletter prompt or
any image, publishes, and the next site build shows the change in the right place. No developer is
involved.

**Why this priority**: This is the reason for the feature: removing the developer from routine content
changes.

**Independent Test**: Change one field of each content kind, publish, rebuild, and confirm each change
appears on the correct page(s) and nowhere else.

**Acceptance Scenarios**:

1. **Given** a published site, **When** an editor changes the home headline and rebuilds, **Then** the new
   headline appears, with the design's styling (including the highlighted word), and all other content is
   unchanged.
2. **Given** a person's bio, **When** the editor adds a paragraph, **Then** it appears in the expandable
   "full bio" section and the expand/collapse interaction still works.
3. **Given** a list (stats, services, industries, drivers, people, testimonials, hero slides, nav, footer
   columns), **When** the editor reorders, adds or removes items, **Then** the site shows the new order and
   count after rebuild.
4. **Given** an image field, **When** the editor replaces the image, **Then** the new image renders in the
   same crop and size behavior as the design, with the editor-provided alternative text.

---

### User Story 3 - An editor publishes a new insight article (Priority: P3)

An editor creates a new insight (white paper or article) with title, summary, tags, cover image, date,
authors, body (including a pull quote) and related reading, publishes, and after the next build the article
has its own page at a stable, readable address. It appears in the insights listing and, if chosen, on the
home page.

**Why this priority**: Articles are the content that changes most, and today every "Learn more" leads to
the same page.

**Independent Test**: Create one new article, rebuild, open its address, and confirm it appears in the
listing and links correctly from its card.

**Acceptance Scenarios**:

1. **Given** a new published article with a unique address slug, **When** the site is rebuilt, **Then** it
   has its own page using the article layout, and its card's "Learn more" opens that page.
2. **Given** the editor marks up to three articles as featured, **When** the site is rebuilt, **Then**
   those articles appear in the home page's "latest insights" in the chosen order.
3. **Given** an article's address is changed, **When** the site is rebuilt, **Then** the article is served
   at the new address and every link to it uses the new address.
4. **Given** a newsroom item pointing to an external URL, **When** rebuilt, **Then** its "Learn more"
   opens that URL in a new tab. **Given** one pointing to an internal article, **Then** it opens that
   article's page.
5. **Given** the about page, **When** an editor moves the leadership section above a rich-text band, or
   adds a testimonial carousel, **Then** the rebuilt page shows the new order with each section styled as
   in the design.

---

### User Story 4 - An editor controls how each page appears in search and sharing (Priority: P4)

Each page, and each article, has editable title, description and share image used for search results and
link previews, with sensible site-wide defaults when a page leaves them blank.

**Why this priority**: Valuable, but the site works without it.

**Independent Test**: Set a custom title/description/share image on one page and leave another blank;
rebuild; check both pages' metadata.

**Acceptance Scenarios**:

1. **Given** a page with custom SEO fields, **When** rebuilt, **Then** its metadata uses them.
2. **Given** a page with blank SEO fields, **When** rebuilt, **Then** it falls back to the site-wide
   defaults.

### Edge Cases

- **Required content missing:** a required field is empty or a referenced item is unpublished. The build
  MUST fail with a message naming the entry and field. It must not ship a page with blank sections.
- **Content service unreachable or credentials wrong at build time:** the build fails loudly. It never
  silently ships an empty or stale site.
- **Text much longer than the design's copy:** the layout wraps without overlapping or clipping, and the
  design's responsive behavior is preserved. This is not guaranteed to be pixel-identical to the design.
- **Duplicate or invalid article address:** rejected at the content level (unique, URL-safe), so two
  pages never collide.
- **Deleted article still referenced** (featured, related reading): it is omitted from lists, not shown
  as a broken card.
- **Image without alternative text:** decorative images may have none. For meaningful images (people,
  logos, icons with no adjacent label), alternative text is required.
- **Credentials pasted into tracked files:** the repository's secret scanning must catch it before it is
  committed.

## Requirements *(mandatory)*

### Functional Requirements

**Content coverage**

- **FR-001**: Every piece of visible copy and every image on all current pages MUST come from managed
  content. This covers home, services, industries, about, insights, the article page and contact, plus
  the shared header, newsletter band and footer. Exceptions, which stay in code:
  - form mechanics: validation messages, sending/sent states;
  - structural glyphs: arrows, the quote marks.
- **FR-002**: Lists MUST be editor-ordered and editor-sized: hero slides, stats, testimonials, services,
  methodology drivers, industries, leadership people, insights, newsroom items, related reading, header
  navigation, footer columns and their links, and legal links.
- **FR-003**: Reusable content MUST be authored once and referenced wherever it appears. For example, a
  testimonial shown on both home and industries, or an article shown in several lists.
- **FR-004**: Each insight article MUST have its own page at `/insights/<slug>`. The slug is unique,
  URL-safe and editor-set. The current white-paper page becomes one such article.
- **FR-005**: Rich text (article bodies, bios, paragraphs with emphasis) MUST support at least:
  paragraphs, bold/emphasis, links, and a highlighted pull-quote block rendered in the design's style.
- **FR-006**: Emphasis inside headlines (the teal "Build" in "We Build Companies") MUST be editor-controlled.
  It must not be hard-coded to a particular word.
- **FR-007**: Per-page and per-article SEO fields (title, description, share image) MUST be editable, with
  site-wide defaults.
- **FR-008**: Page composition is **hybrid**:
  - **Fixed layouts** for home, insights listing, contact, and the article template. Editors change every
    field and list, but the section order is the design's.
  - **Editor-arrangeable sections** for services, industries and about. Each page is an ordered list of
    sections chosen from a library matching the design's blocks: split hero, card grid, methodology
    drivers, icon grid, testimonial carousel, leadership bios, rich-text band. Editors can add, remove and
    reorder sections, and reuse any library section on any of those three pages.
- **FR-009**: Each newsroom item's "Learn more" MUST go where the editor chooses, per item: **either** an
  internal article page (`/insights/<slug>`, same as FR-004) **or** an external URL, which opens in a new
  tab. An item MUST have exactly one of the two, validated at the content level.

**Setup, safety and fidelity**

- **FR-010**: The content structure MUST be defined as versioned, reviewable change scripts in the
  repository. Every structure change is:
  - applied to a sandbox copy first;
  - summarized in plain language;
  - applied to the main environment only after the owner approves.
  Changes MUST be additive or come with a documented reversal. Any destructive step, such as removing a
  field or type, MUST be preceded by an export of the environment and be a separate, explicitly approved
  change.
- **FR-011**: A repeatable, idempotent seed MUST populate a new space with today's exact copy and the
  current images. The images are placeholders until the real exports are supplied.
- **FR-012**: The site MUST fetch content only when it is built. The built output needs no server and no
  credentials at runtime, and is deployable to any static host.
- **FR-013**: Credentials (space identifier, read tokens, management tokens) MUST come from the
  environment. They must never be committed and never included in the built site. Management
  (write) credentials are used only by setup scripts.
- **FR-014**: The site's code MUST work with content through generated, type-checked definitions of the
  content structure. A structure change the code doesn't handle MUST fail type-checking.
- **FR-015**: With seeded content, the design-fidelity checks MUST report MATCH at the 0.1% threshold on
  every page, width and interactive state that is checked today.
- **FR-016**: Animations, interactions and form behavior MUST work exactly as today with CMS-driven
  content. That includes the slideshow timing, count-up statistics, quote carousel, bio expand, menu,
  tabs and simulated submissions.
- **FR-017**: Content errors (missing required fields, broken references) MUST fail the build with the
  entry and field named.
- **FR-018**: The insights page's "Latest insights" and "Newsroom" lists MUST be curated, editor-ordered
  selections. Every published article MUST still get its own page and be linkable, even when it isn't in
  a list. The home "latest insights" follows the Assumptions rule: featured articles first, then filled
  by date.
- **FR-019**: Editable copy that includes a visitor's input MUST support named placeholders that are
  substituted at runtime, for example the contact thank-you "Thank you, {firstName}." and "…reply to
  {email}…". A version without the placeholder is used when the value is empty, matching today's
  behavior.

### Key Entities

- **Site settings**: site name, default SEO, logo, social links, header navigation, footer columns,
  regional tagline, copyright and legal links, and the newsletter band copy.
- **Page**: one per route. Holds SEO, plus either fixed fields (home, insights, contact) or an ordered
  list of sections (services, industries, about), per FR-008.
- **Section**: one block from the library (split hero, card grid, methodology drivers, icon grid,
  testimonial carousel, leadership bios, rich-text band). Holds its own content and references. It can be
  placed on any arrangeable page.
- **Hero slide**: an image with focal-point and crop behavior, used in the home slideshow.
- **Statistic**: a numeric value (so it can count up), a suffix (e.g. "+", "%") and a label.
- **Testimonial**: a quote and an attribution (name, title, company). Reusable.
- **Service**: a title, paragraphs, and an optional highlighted ("dark") treatment with a partner link.
- **Methodology driver**: an image, a title and a body.
- **Industry**: a name and an icon.
- **Person**: name, role, portrait, a lead paragraph and a full bio.
- **Insight article**: title, slug, type (white paper or article), date, tags, cover image, summary,
  authors, body, author bios, a download link, related reading, SEO, and whether it is featured on home.
- **News item**: title, date, tags, image, and a destination: an internal article **or** an external URL,
  exactly one (FR-009).
- **Tag**: a label. The first tag of each card renders highlighted, as in the design.
- **Contact page copy**: per-audience intros, tab labels, message labels, and the thank-you copy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Built from freshly seeded content, the site matches the approved design with 0% measured
  drift at a 0.1% threshold. The check covers 7 pages at 5 widths each (35 checks) and 10 interactive
  states.
- **SC-002**: 100% of visible text and images, other than the FR-001 exceptions, can be changed by an
  editor without a code change. This is verified by an audit that edits one field of every content kind.
- **SC-003**: An editor can change a headline, publish and see it on the rebuilt site without developer
  help, with no more than 5 editor actions before the rebuild.
- **SC-004**: A new article is live at its own address after one rebuild, with 0 broken links to it.
- **SC-005**: Setting up a brand-new space from nothing takes one documented sequence of commands and
  under 15 minutes, excluding account creation.
- **SC-006**: 0 credentials appear in the repository history or in the built site. This is verified by
  scanning the build output and the commits.

## Assumptions

- **Account and credentials:** the owner creates the account, the space and the credentials, and
  provides them through environment variables. Agents never create accounts or handle raw credentials in
  chat.
- **Publishing trigger:** out of scope. Content changes appear on the next build, whoever runs it. How
  publishing will trigger builds (a GitHub Pages webhook or a Cloudflare setup) is decided later and
  gets its own spec.
- **No draft preview:** there is no preview of unpublished content on the live site. It depends on the
  hosting decision.
- **Build request volume:** the site is small (tens of entries, about 40 images), so a full build stays
  well inside the content service's delivery rate limits. No throttling requirement for now.
- **Language:** English only. Localization is out of scope.
- **Images:** the seed uploads the current placeholder images. The owner replaces them with real exports
  in the content space. The design's own placeholder copy (e.g. "[Client name]") is seeded verbatim as
  editor to-dos.
- **Forms:** contact and newsletter forms keep their simulated submission. A real submission backend is
  a separate feature.
- **Editors:** use the content service's standard editor roles. No custom workflow or approvals.
- **Home "latest insights":** it shows up to 3 featured articles in editor order. If fewer than 3 are
  featured, the remaining slots are filled with the most recent articles by date.
- **Arrangeable pages:** editors rearrange sections only on the three existing arrangeable pages. Creating
  brand-new pages/routes from the content space is out of scope; the route list stays fixed in code.
- **Seeded content and fidelity:** fidelity is guaranteed for the seeded content. Content edited later
  keeps the layout but is not expected to be pixel-identical to the original design.
