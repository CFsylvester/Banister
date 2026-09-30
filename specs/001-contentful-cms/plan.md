# Implementation Plan: Editor-managed site content (Contentful)

**Branch**: `001-contentful-cms` (to be cut from `main` after the spec-workspace PR merges) | **Date**: 2026-09-30 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/001-contentful-cms/spec.md`

## Summary

Move every piece of editorial content out of the code and into a new Contentful space.
- The content structure is written as reviewed, sandbox-first migrations.
- It's seeded from today's exact copy and placeholder images.
- It's read **at build time** through a typed, server-only delivery client and a mapping layer. The
  mapping layer turns entries into the props the existing, pixel-proven components already take.

Composition is hybrid:
- **Fixed layouts:** home, insights, contact and the article template.
- **Editor-ordered sections:** services, industries and about.

Articles get real `/insights/<slug>` pages. Newsroom items link to an internal article or an external
URL. The static export stays host-agnostic, and publishing triggers are out of scope. A committed seed
dataset doubles as an offline `fixture` source, so the pixel gates and local dev run without
credentials and prove parity before the live space exists.

## Technical Context

- **Language/Version:** TypeScript 5 (strict), Node ≥ 22.13 (pnpm 11)
- **Primary Dependencies:**
  - Next.js 16.3.7 (App Router, `output: "export"`)
  - Tailwind v4 without Preflight
  - `contentful` 11.12.10 (delivery)
  - `@contentful/rich-text-react-renderer` 16.2.2 and `@contentful/rich-text-types` 17.2.7
  - Scripts only: `contentful-management` 12.19.0, `contentful-migration` 5.1.1,
    `cf-content-types-generator` 3.0.1
- **Storage:** Contentful (a new space; `master` plus sandboxes). The committed model export is at
  `contentful/content-model.json` and the seed dataset at `contentful/seed/`.
- **Testing:**
  - Node's built-in test runner for the mapping layer (R10).
  - The existing Playwright pixel gates (`match:pages` and `match:interactions` at 0.1%) for fidelity.
  - `lint`, `tsc` and `next build`.
- **Target Platform:** any static host. Build output is `out/` under `basePath` (GitHub Pages today).
- **Project Type:** web application, a single Next.js app.
- **Performance Goals:** a full build makes fewer than 30 delivery requests (R8). The site gets no new
  runtime requests, because images are downloaded at build (R7).
- **Constraints:**
  - no server runtime;
  - no token in `out/` or git;
  - 0% pixel drift with seeded content;
  - model changes go through sandbox → owner approval → `master`.
- **Scale/Scope:** 7 routes plus N article pages, about 25 content types, about 80 seeded entries and 40
  assets.

## Constitution Check (pre-research: PASS · post-design: PASS)

| Principle / gate | How the plan satisfies it |
|---|---|
| I Spec-first | Spec, clarifications and a 28-item quality gate were done before this plan. |
| II Detect before prescribe | Stays on the repo's stack (Tailwind, single app, static export). No SCSS, monorepo or Vercel introduced. |
| III Verify, don't assume | Every library claim is cited to a package README or typings, or to Contentful docs (research.md). Unverified items are tagged. |
| IV Design fidelity measured | The fixture mode plus the pixel gates at 0.1% are the acceptance test. Components' visual markup is unchanged; only their data source changes. |
| V Content is data, layout is code | This is the whole feature. It also keeps build-time-only fetching (R1). |
| VI Plan-and-approve | `cms:migrate` and `cms:seed` refuse `master` without `--approve`. Sandbox first. Destructive changes are separate and exported first (FR-010). |
| Secrets | Env only. The management token is used only by `scripts/cms/*`, and the delivery client imports `server-only`. The build output is scanned (quickstart D). |
| Next.js boundaries | Fetching happens in Server Components, and client components receive plain props. |
| Styling | No new raw values; existing tokens and design-exact arbitrary values only. |
| Contentful rules | camelCase singular IDs, references for reuse, migrations, generated types (data-model.md). |

## Project Structure

### Documentation (this feature)

```text
specs/001-contentful-cms/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/ (env-and-scripts.md, routes.md)
├── checklists/ (requirements.md, cms-requirements.md)
└── tasks.md            # next phase (/speckit-tasks)
```

### Source Code (repository root)

```text
contentful/
├── migrations/0001-shared.ts … 0005-articles-news.ts   # reviewed model changes, applied in order
├── content-model.json                                   # committed export → type codegen input (R4)
└── seed/                                                # today's content as data (seed + fixture, R6)
    ├── entries.json   (deterministic IDs)
    └── assets.json    (→ files in design/assets/)
scripts/cms/
├── sandbox.mjs · migrate.mjs · seed.mjs · export-model.mjs   # management token only
design/assets/                     # moved from public/assets (R9); design target + seed source
src/
├── types/contentful/              # GENERATED, git-ignored (cf-content-types-generator)
├── lib/cms/
│   ├── client.ts                  # 'server-only'; delivery client + withoutUnresolvableLinks (R2)
│   ├── source.ts                  # CONTENT_SOURCE switch: contentful | fixture
│   ├── map/*.ts                   # entry → view-model props; ContentError on missing required (FR-017)
│   ├── assets.ts                  # download-at-build into public/cms/ (R7)
│   ├── richtext.tsx               # renderers: headline (bold→teal), body (quote→pull quote)
│   └── *.test.ts                  # mapping-layer unit tests (R10)
├── components/
│   ├── sections/SectionRenderer.tsx + one component per section type (wrapping existing markup)
│   └── (existing components now take content via props; visual markup unchanged)
└── app/
    ├── page.tsx, insights/page.tsx, contact/page.tsx          # fixed layouts, async data
    ├── [slug]/page.tsx → services|industries|about via generateStaticParams (arrangeable)
    └── insights/[slug]/page.tsx                                # article template, generateStaticParams
```

**Structure decision:** a single app, as today.
- The CMS concerns are isolated in `contentful/` (model and data), `scripts/cms/` (management, never
  imported by the app) and `src/lib/cms/` (read path).
- `src/lib/content.ts` is deleted once the seed dataset replaces it.
- The three arrangeable pages collapse into one dynamic segment. The static-export `generateStaticParams`
  pins it to exactly `services`, `industries` and `about` (with `dynamicParams = false`), so no other
  slug renders.

## Delivery in reviewable slices (each a PR, each keeping the gates green)

1. **Read path + fixture:**
   - `src/lib/cms/*`, the seed dataset, `CONTENT_SOURCE=fixture`.
   - Components are fed from the mapping layer, and `content.ts` is removed.
   - Gate: pixel MATCH at 0.1% plus unit tests. **No Contentful account needed.**
2. **Model + scripts:**
   - migrations 0001–0005 and `scripts/cms/*`;
   - the committed `content-model.json` (written by hand from data-model.md until a live export
     replaces it);
   - type codegen wired to `prebuild`.
   - Gate: `tsc` against the generated types.
3. **Live space bring-up (needs the owner):** the owner creates the account, space and tokens, then runs
   quickstart B against a sandbox, and approves promotion to `master`. Gate: pixel MATCH on a live build.
4. **Editor affordances:** the arrangeable sections library including `sectionRichText`, article and
   newsroom routes with external links, and SEO fallbacks. Gate: the quickstart C scenarios.

## Risks

- **Sandbox availability on the chosen plan** `[unverified]`. If none is allowed, fall back to a
  temporary second space as the sandbox. The owner confirms this at slice 3.
- **The seed must match the design copy character for character.** The pixel gate catches a mismatch;
  the fixture is the same data.
- **Rich-text validation keys** in migrations must be checked against the contentful-migration README at
  implement time (R5).

## Complexity Tracking

| Deviation | Why needed | Simpler alternative rejected because |
|---|---|---|
| Fixture content source alongside Contentful | Lets the pixel gate and dev run without credentials, and the seed and fixture can't drift | A live space for every check blocks slice 1 on account creation and makes CI depend on secrets |
| Committed `content-model.json` although the types folder is git-ignored | Codegen without a management token at build (R4); model diffs are reviewable | Live-space codegen needs a write token in every build |
| Images downloaded at build | Self-contained output, deterministic gates (R7) | Hot-linking the CDN ties the live site to Contentful uptime; revisit at the hosting decision |
