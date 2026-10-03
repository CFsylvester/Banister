# Tasks: Editor-managed site content (Contentful)

**Input**: `specs/001-contentful-cms/` — plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: included for the mapping layer (plan R10). End-to-end fidelity is the existing pixel gates.
**Owner-gated tasks** are marked **(OWNER)**. They need the Contentful account, space and tokens and stay
open until the owner provides them. Everything else runs offline via `CONTENT_SOURCE=fixture`.

## Slice H: homepage first (owner re-scope, 2026-09-30)

The owner narrowed the immediate scope to **the homepage only**. This is a subset of the approved plan;
nothing new is added.
- **In this slice:** T001, T002, T004–T013, and the home-only parts of T014–T015, T017, T023, T025,
  T033–T038 and T047.
- **Env:** the owner uses **direnv** (`.envrc`, git-ignored via `.env*`), not `.env.local`. Scripts and
  the build read `process.env` directly.
- **Analyze remediation F1 is applied:** `insightArticle.homeCardImage`.
- **Header, footer and newsletter band stay in code** for this slice.
- **Home "Learn more" links:** they go to `/insights/<slug>/` when that article page exists (today only
  the white paper), otherwise to `/insights/`, with a build warning. This avoids links to article pages
  that don't exist yet.

## Phase 1: Setup

- [ ] T001 Add deps to package.json:
  - dependencies: `contentful@11.12.10`, `@contentful/rich-text-react-renderer@16.2.2`,
    `@contentful/rich-text-types@17.2.7`, `server-only`
  - devDependencies: `contentful-management@12.19.0`, `contentful-migration@5.1.1`,
    `cf-content-types-generator@3.0.1`
  - Run `pnpm install`.
- [ ] T002 [P] Update `.gitignore`: add `src/types/contentful/`, `public/cms/` and `.env.local` (confirm the
  env pattern is already covered).
- [ ] T003 [P] Move the placeholder images from `public/assets/` to a real `design/assets/` directory,
  replacing the symlink. Update `scripts/make-placeholder-assets.mjs` to write there. Then check that
  `node scripts/visual-diff.mjs --target design/banister-v2.dc.html …` still renders the target with
  images.
- [ ] T004 [P] Add package scripts per contracts/env-and-scripts.md: `test`, `cms:types`,
  `cms:sandbox`, `cms:migrate`, `cms:seed`, `cms:export-model`, and a `prebuild` that runs `cms:types`.
  Verify at implement how Node 22.21 runs the `.ts` tests (R10).

## Phase 2: Foundational (blocks every story)

- [ ] T005 Write `contentful/content-model.json`: every content type in data-model.md, with fields,
  validations and link types, in the content-type export format. This is hand-authored until the live
  export replaces it in T040.
- [ ] T006 Generate types (`pnpm cms:types` → `src/types/contentful/`) and confirm `tsc` accepts them.
- [ ] T007 [P] `src/lib/cms/errors.ts`: a `ContentError` class carrying `contentType`, `entryId` and
  `field`, and a `required(entry, field)` helper (FR-017).
- [ ] T008 [P] `src/lib/cms/client.ts`: `import "server-only"`; build
  `createClient({ space, accessToken, environment }).withoutUnresolvableLinks` from `CONTENTFUL_*`
  env. Throw on missing variables, naming them (contracts: env).
- [ ] T009 [P] `src/lib/cms/fixture.ts`: load `contentful/seed/entries.json` and `assets.json`, and
  resolve links into the same resolved-entry shape the delivery client returns, so the mapping layer is
  source-agnostic.
- [ ] T010 `src/lib/cms/source.ts`:
  - `getEntries(contentType, query)` switches on `CONTENT_SOURCE` (`fixture` | `contentful`);
  - singleton helpers `getSingleton(type)`;
  - `getBySlug(type, slug)`.
- [ ] T011 [P] `src/lib/cms/assets.ts`: `resolveImage(asset)` → `{ src, alt, width, height }`.
  - Fixture: `design/assets/<file>`, copied into `public/cms/` at build.
  - Contentful: download `https:` + `asset.fields.file.url` into `public/cms/<assetId>-<version>.<ext>`
    once per build (R7).
  - Returns a path that goes through `asset()`.
- [ ] T012 [P] `src/lib/cms/richtext.tsx`:
  - `Headline` renders RT(h), with bold → `<span className="text-teal">`;
  - `RichBody` renders RT(body): paragraphs, links, quote → the design's pull-quote block (classes copied
    from the current article page);
  - built with `documentToReactComponents` (R5).
- [ ] T013 [P] `src/lib/cms/placeholders.ts`: `fill(template, { firstName, email })` plus a choice
  between the with-value and no-value variants (FR-019).

## Phase 3: US1 — A fresh space reproduces today's site exactly (P1) 🎯 MVP

**Goal:** all content comes from the CMS source, and with seeded data the site is pixel-identical.
**Independent test:** `CONTENT_SOURCE=fixture pnpm build:pages && pnpm preview`, then
`pnpm match:pages && pnpm match:interactions` → ALL MATCH at 0.1%.

### Seed dataset (also the fixture)

- [ ] T014 [US1] Write `contentful/seed/assets.json`, one entry per image in `design/assets/`, with the
  asset ID, file, title and alt description. Use the alt text the components render today (logo "Banister
  International", people's names, social labels; decorative images empty).
- [ ] T015 [US1] Write `contentful/seed/entries.json` with deterministic IDs, transcribing
  `src/lib/content.ts` plus the literal copy in `src/app/**/page.tsx` and `src/components/*` character for
  character:
  - `siteSettings`, `navigationLink`, `footerColumn`, `socialLink`, `seo`, `tag`, `testimonial`,
    `statistic`;
  - `homePage`, `insightsPage`, `contactPage`;
  - the pages `services`, `industries` and `about` with their `section*` entries, `service`,
    `methodologyDriver`, `industry` and `person`;
  - `insightArticle` `state-of-talent-acquisition` plus the other insight cards;
  - `newsItem`s, pointing to that article, as today.
  Rich-text fields are written as Contentful document JSON.

### Mapping layer (tests first)

- [ ] T016 [P] [US1] `src/lib/cms/map/settings.test.ts` + `settings.ts`: siteSettings → header, footer
  and subscribe props. Test: a missing `logo` throws a ContentError naming `siteSettings.logo`.
- [ ] T017 [P] [US1] `src/lib/cms/map/home.test.ts` + `home.ts`: homePage → hero (slides, headline doc,
  CTA), intro, stats, testimonials, insights cards. Test: the featured-then-newest-by-date fill up to 3.
- [ ] T018 [P] [US1] `src/lib/cms/map/insights.test.ts` + `insights.ts`: insightsPage and article cards,
  plus newsItem destinations. Tests:
  - both `article` and `externalUrl` set → ContentError;
  - neither set → ContentError;
  - external → `{ href, external: true }`.
- [ ] T019 [P] [US1] `src/lib/cms/map/article.ts`: insightArticle → the article-page props (hero, dek,
  authors, body, bios, download, related).
- [ ] T020 [P] [US1] `src/lib/cms/map/contact.test.ts` + `contact.ts`: contactPage → per-audience copy.
  Test: the thank-you placeholders with a value and with an empty value (FR-019).
- [ ] T021 [P] [US1] `src/lib/cms/map/sections.ts`: page.sections → a discriminated union of section
  props, one variant per `section*` type.

### Components take props (visual markup unchanged)

- [ ] T022 [US1] `src/app/layout.tsx` (async): load settings and pass props to `SiteHeader`,
  `SubscribeBand` and `SiteFooter`. Update those three components to take nav, logo, prompts, columns,
  socials, legal and tagline from props, not `@/lib/content`.
- [ ] T023 [P] [US1] `HeroSlides`, `Stats` and `Quotes` take `slides`, `stats` and
  `testimonials`/`heading` props (the timing logic is unchanged).
- [ ] T024 [P] [US1] `InsightGrid`/`NewsGrid` take cards with a resolved `href`/`external`. The newsroom
  CTA renders a `<Link>`, or an `<a target="_blank" rel="noopener noreferrer">` for external links (same
  classes).
- [ ] T025 [US1] `src/app/page.tsx` (home): async; built from `map/home` (the fixed layout is unchanged).
- [ ] T026 [US1] `src/app/insights/page.tsx`: built from `map/insights`.
- [ ] T027 [US1] `src/app/insights/[slug]/page.tsx`: `generateStaticParams` over all published
  insightArticles, `dynamicParams = false`, the article template (moved from the current page) fed by
  `map/article`. Delete `src/app/insights/state-of-talent-acquisition/`.
- [ ] T028 [US1] `src/components/sections/*`: one component per section type. Each wraps the existing
  markup (`PageHero` → SplitHero, service cards → ServiceGrid, methodology → Methodology, industries grid
  → IndustryGrid, `Quotes` → Testimonials, `PersonBio` list → Leadership, new RichText band).
  `SectionRenderer.tsx` switches on the union from T021.
- [ ] T029 [US1] `src/app/[slug]/page.tsx`: `generateStaticParams` → `services`, `industries`, `about`;
  `dynamicParams = false`; renders `SectionRenderer`. Delete `src/app/services`, `src/app/industries` and
  `src/app/about`.
- [ ] T030 [US1] Contact: the page passes `contactPage` copy into `ContactFromQuery` → `ContactForm`.
  Replace the hard-coded intros, tab labels, message labels, consent and thank-you copy (the form
  mechanics stay in code).
- [ ] T031 [US1] Delete `src/lib/content.ts`, and grep `src/` for leftover literal copy from the design
  (the SC-002 audit, part 1).
- [ ] T032 [US1] **Gate:** `pnpm lint`, `npx tsc --noEmit`, `pnpm test`, then
  `CONTENT_SOURCE=fixture pnpm build:pages && pnpm preview` → `pnpm match:pages && pnpm
  match:interactions` all MATCH at 0.1%. Record the output in the PR.

### Model and scripts (the live half of US1)

- [ ] T033 [P] [US1] `contentful/migrations/0001-shared.ts` … `0005-articles-news.ts`: the
  contentful-migration DSL creating every type and validation in data-model.md (unique slugs, the slug
  regexp, rich-text node/mark limits, link content types, list sizes). Verify the validation keys against
  the contentful-migration 5.1.1 README (R5).
- [ ] T034 [P] [US1] `scripts/cms/lib.mjs`: shared env loading (via `.env.local`), a management client,
  the `--env`/`--approve` guard (refuses `master` without `--approve`, exit 2), and a plain-language
  summary printer.
- [ ] T035 [P] [US1] `scripts/cms/sandbox.mjs`: `space.createEnvironmentWithId(id, { name })`, cloned
  from master. Idempotent: an existing environment is OK.
- [ ] T036 [US1] `scripts/cms/migrate.mjs`: apply `contentful/migrations/*` in order via `runMigration({
  filePath, spaceId, accessToken, environmentId, yes: true })`. Record the applied IDs in a
  `migrationLog` entry, or skip the ones already applied.
- [ ] T037 [US1] `scripts/cms/seed.mjs`:
  - upsert assets (`createAssetFromFiles` → `processForAllLocales` → publish);
  - upsert entries with `createEntryWithId` (or an update when the entry exists);
  - publish.
  Deterministic IDs make it idempotent. It prints created, updated and unchanged counts.
- [ ] T038 [P] [US1] `scripts/cms/export-model.mjs`: write the environment's content types to
  `contentful/content-model.json` in stable (sorted) order.
- [ ] T039 (OWNER) [US1] The owner creates the account, space, delivery token and management token, and
  fills in `.env.local`. They confirm sandbox availability on their plan (plan risk).
- [ ] T040 (OWNER) [US1] Quickstart B steps 2–5 against the sandbox: migrate, seed, a live build, the
  gates MATCH, and a re-seed that creates nothing. Then the owner approves promotion to master, and the
  real export replaces `contentful/content-model.json`.

## Phase 4: US2 — An editor changes any existing text or image (P2)

**Independent test:** quickstart C rows "Headline", "List order", "Bio" on a sandbox, plus the SC-002 audit.

- [ ] T041 [US2] `docs/editing.md`: for each page, where each visible item lives in Contentful (the
  content type and field). This is the SC-002 audit table.
- [ ] T042 (OWNER) [US2] Run the quickstart C editor scenarios on the sandbox and record the results in
  the PR.

## Phase 5: US3 — An editor publishes a new insight article (P3)

**Independent test:** quickstart C rows "New article", "Newsroom external", "Newsroom invalid".

- [ ] T043 [US3] Add a fixture-only test article to prove `generateStaticParams`, then remove it from
  the fixture (or keep it in a test-only fixture): `/insights/<slug>/` exists and its card links there.

## Phase 6: US4 — An editor controls each page's search/share metadata (P4)

- [ ] T044 [P] [US4] `src/lib/cms/map/seo.ts` + test: per-page `seo` falls back field by field to
  `siteSettings.defaultSeo`.
- [ ] T045 [US4] `generateMetadata` in `layout.tsx`, `page.tsx`, `insights/page.tsx`,
  `insights/[slug]/page.tsx`, `[slug]/page.tsx` and `contact/page.tsx` → title, description, openGraph
  image.

## Phase 7: Polish and cross-cutting

- [ ] T046 [P] README: the CMS section (env vars by name only, scripts, fixture mode, the sandbox-first
  rule).
- [ ] T047 [P] `.github/workflows/pages.yml`: set the build to `CONTENT_SOURCE=fixture` until the live
  space exists (T040). Add a comment on switching to `contentful` with a repo secret. The publishing
  trigger itself stays out of scope.
- [ ] T048 Security scan (SC-006): grep the built `out/` and the committed history for token values from
  the environment. Confirm `contentful-management` is not in the client bundle (grep
  `out/_next/static` for "contentful-management").
- [ ] T049 Final gate: repeat T032 and run `/review code` over the diff before the PR (the kit's rule).

## Dependencies and order

- Setup (T001–T004) → Foundational (T005–T013) → US1.
- Within US1:
  - the seed (T014–T015) comes before the mappers (T016–T021);
  - the mappers come before the components and pages (T022–T031);
  - then the gate (T032);
  - the model and scripts (T033–T038) can run in parallel with T016–T031;
  - the OWNER tasks (T039–T040) come last.
- US2–US4 need the US1 read path. US4's T044 can start once T010 exists.

## Parallel opportunities

- T002, T003 and T004 in parallel.
- T007, T008, T009, T011, T012 and T013 in parallel.
- T016–T021 (separate mapper files) in parallel.
- T033–T038 (migrations and scripts) in parallel with the component work.

## Implementation strategy

- **MVP = Phase 1 + 2 + US1 through T032** (offline, pixel-proven). Ship it as PR 1.
- T033–T038 (+ US4) are PR 2.
- T039–T042 need the owner.
