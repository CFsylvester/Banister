# Research: Editor-managed site content (Contentful)

All facts below were checked on 2026-09-30 against the package's own published README/typings (npm
tarballs of the listed versions) or first-party Contentful docs read that day. Anything not verified is
tagged `[unverified]`.

## Versions (npm registry, 2026-09-30)

| Package | Version | Role |
|---|---|---|
| `contentful` | 11.12.10 | Delivery client (build-time reads) |
| `contentful-management` | 12.19.0 | Setup scripts only: environments, seed, export |
| `contentful-migration` | 5.1.1 | Content-model change scripts |
| `cf-content-types-generator` | 3.0.1 | Type generation |
| `@contentful/rich-text-react-renderer` | 16.2.2 | Rich text → React |
| `@contentful/rich-text-types` | 17.2.7 | Rich-text node/mark constants |

## R1 — Build-time fetch keeps the site host-agnostic
- **Decision:** fetch every entry during `next build` in Server Components. Content-driven routes use
  `generateStaticParams`. No runtime fetching and no tokens in the client bundle.
- **Rationale:** the site is already `output: "export"`. Next's static-export guide lists "Dynamic Routes
  without `generateStaticParams()`" as unsupported, so `/insights/[slug]` must enumerate its slugs
  (`node_modules/next/dist/docs/01-app/02-guides/static-exports.md`, "Unsupported Features"). The same
  output runs on GitHub Pages, Cloudflare or any other static host (constitution V).
- **Alternatives:**
  - ISR or on-demand revalidation: needs a server, and publishing is out of scope.
  - Client-side fetching: exposes a token, has no SEO, and delays rendering.

## R2 — Delivery client and link handling
- **Decision:** a single server-only client, `createClient({ space, accessToken, environment })`, used
  through the `withoutUnresolvableLinks` chain modifier.
- **Rationale:** the contentful 11.12.10 README ("Client chain modifiers") says that with
  `withoutUnresolvableLinks`, links to entries that can't be resolved are removed from the response.
  That implements the spec edge case "deleted article still referenced → omitted, not a broken card".
  *Required* references are still checked by our own mapping layer (R6), because silently dropping a
  required hero image must fail the build (FR-017).
- **Alternatives:** the default link resolution leaves unresolved link objects in lists, which then need
  manual filtering everywhere.

## R3 — Model changes as migrations, sandbox first
- **Decision:** numbered `contentful-migration` scripts in `contentful/migrations/`, run by a thin script
  using `runMigration({ filePath, spaceId, accessToken, environmentId, yes })`.
- **Rationale:**
  - The contentful-migration 5.1.1 README documents programmatic `runMigration` with an
    `environmentId` option (default `'master'`).
  - The Contentful docs (Multiple environments, 2026-09-30) say every space has a `master`
    environment, sandboxes are made by cloning `master`, and API keys can be restricted per environment.
  - Sandboxes are created with `space.createEnvironmentWithId(...)` (contentful-management 12.19.0
    typings).
  - The script refuses `master` unless `--approve` is passed.
- **Alternatives:** editing the model in the web app is not reviewable or repeatable, and violates
  constitution VI and the kit's Contentful skill.
- **Plan limits:** sandbox availability and count depend on the Contentful plan the owner picks
  `[unverified]`. The owner confirms that a sandbox can be created before the first run.

## R4 — Types without a management token at build time
- **Decision:**
  - After each approved migration, export the content types to a committed `contentful/content-model.json`.
  - Generate TypeScript with `cf-content-types-generator contentful/content-model.json -o
    src/types/contentful --response`.
  - The output folder is git-ignored and regenerated before `tsc`/build.
- **Rationale:**
  - The cf-content-types-generator 3.0.1 README documents generating from a local export file, and that
    3.x removed the pre-v10 output (`--v10` is gone; the output targets the current SDK).
  - The kit's Contentful skill says generated types are never hand-edited.
  - A committed model export means CI and builds need only the read token, and model diffs are
    reviewable in PRs.
- **Alternatives:** generating from the live space (`-s -t -e`) requires a management token in every
  build.

## R5 — Rich text, and headline emphasis
- **Decision:**
  - Use `documentToReactComponents(doc, { renderNode, renderMark })` from
    `@contentful/rich-text-react-renderer` 16.2.2.
  - Article bodies map `BLOCKS.QUOTE` to the design's yellow pull quote.
  - Headlines are rich-text fields restricted to paragraphs plus the **bold** mark. Bold renders as the
    teal highlight ("We **Build** Companies").
- **Rationale:** editors use the normal bold button, and nothing is hard-coded (FR-006). Rich-text field
  validations for allowed nodes and marks are a documented part of the Contentful model
  `[unverified — confirm exact validation keys against the contentful-migration README at implement]`.
- **Alternatives:** `*markup*` inside a plain-text field is easy for editors to break. Separate
  "before/emphasis/after" fields are clumsy.

## R6 — A mapping layer, content errors and a fixture mode
- **Decision:**
  - `src/lib/cms/` maps SDK entries into plain view-model props for the existing components. Components
    never see SDK types.
  - Missing required values throw `ContentError("<contentType>/<entryId>.<field> is required")`, which
    fails the build (FR-017).
  - `CONTENT_SOURCE=fixture` reads the committed seed data (`contentful/seed/`) instead of the network,
    used for local dev without credentials and for the pixel gate.
- **Rationale:**
  - The components keep their current props, so the pixel-proven layout doesn't change.
  - One seed dataset serves as both the space's initial content and the offline fixture, so the two
    can't drift.
  - A production build without `CONTENT_SOURCE=fixture` and without credentials fails loudly (spec edge
    case).

## R7 — Images: download at build
- **Decision:** at build, download every referenced Contentful asset once into `public/cms/` (git-ignored,
  keyed by asset ID and version) and render it through `asset()` as today.
- **Rationale:**
  - The built site stays self-contained, with no runtime dependency on a third-party CDN.
  - The pixel gate is deterministic.
  - It works identically on any static host.
- **Alternatives:** hot-linking the `ctfassets` CDN is simpler and offers the Images API resizing, but it
  makes the live site depend on Contentful's CDN and the gate on the network. It can be revisited when
  the hosting decision is made.

## R8 — Request volume
- **Decision:** fetch in a few collection queries (`getEntries` per content type with `include` depth),
  not per-entry calls.
- **Rationale:** the Contentful CDA reference (API rate limits, 2026-09-30) says cache hits are not
  limited and uncached requests are limited to 55/s by default. A few dozen requests per build is well
  within that (spec assumption).

## R9 — Where the placeholder images live
- **Decision:** move `public/assets/*` to `design/assets/`, replacing the current symlink with a real
  folder.
  - The design target and the seed script read them from there.
  - The site reads images only from CMS content (fixture or live).
- **Rationale:** the site no longer ships design placeholders. The design target keeps working.

## R10 — Tests for the mapping layer
- **Decision:** unit tests for the pure mapping functions:
  - required-field errors (FR-017);
  - placeholder substitution (FR-019);
  - the newsroom exactly-one-destination rule (FR-009);
  - the featured-then-by-date fill (Assumptions).
  They run under Node's built-in test runner. End-to-end fidelity stays with the pixel gates.
- **To verify at implement:** whether Node 22.21 runs `.ts` tests directly
  (`--experimental-strip-types`) or needs a loader `[unverified]`.

## Sources to add to the agents-kit knowledge base
Per the kit's persistence rule, add these to
`agents/tools/corpus/primitives/skills/sync-knowledge-base/references/sources.md`, together with the
kit's `new-spec-project` bug-fix PR:
- The READMEs of `contentful`, `contentful-migration`, `cf-content-types-generator`,
  `contentful-management` and `@contentful/rich-text-react-renderer`. These are first-party Contentful
  repos under github.com/contentful.
- https://www.contentful.com/developers/docs/concepts/multiple-environments/
- https://www.contentful.com/developers/docs/references/content-delivery-api/ (API rate limits)
