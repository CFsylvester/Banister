# Banister International — website

Next.js 16 (App Router, Cache Components) + Tailwind v4 + TypeScript, built from `design/banister-v2.dc.html`,
hosted on **Vercel**. Content comes from Contentful; publishing in Contentful updates the live site within seconds.

Requires Node 22 (`nvm use 22`; Vercel deploys on 22.x via `package.json` engines).

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Set `CONTENT_SOURCE=fixture` (or Contentful keys) in `.envrc` (direnv) first; see Content below.

## Deploy (Vercel)

- Vercel's Git integration builds and deploys every push: previews for branches, production from `main`.
- **Vercel project environment variables (Production):** `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`,
  `CONTENTFUL_ENVIRONMENT` (set to `master`), `REVALIDATE_SECRET`. The management token is never set on Vercel.
- **Publish → live:** a Contentful webhook (filtered to `master`, sending `REVALIDATE_SECRET` as a secret header)
  calls `POST /api/revalidate`. That marks all CMS content stale (`revalidateTag("cms", { expire: 0 })`), so the
  next visitor gets fresh content. Create or update the webhook once the site has a URL:
  ```bash
  pnpm cms:webhook --url https://<site>/api/revalidate --env master --approve
  ```
- **Domain:** stays at its current DNS provider. Add the A (root) or CNAME (subdomain) record Vercel shows under
  Project → Settings → Domains.
- CI (`.github/workflows/ci.yml`) runs tests, lint, the fixture build and tsc on every push and PR.

Production build locally (what the pixel gates check):

```bash
CONTENT_SOURCE=fixture pnpm build && pnpm preview   # http://localhost:3217/
```

## Content (Contentful)

The homepage hero comes from Contentful (cached, refreshed on publish); everything else is still in code for now.

- **Model:** `page` (slug + hero + blocks) → `hero` (rich-text title, images/image) → `button` (internal page or
  external URL). The migrations in `contentful/migrations/` are the source of truth, one content type per file.
- **Content source:**
  - `CONTENT_SOURCE=fixture` renders the committed seed (`contentful/seed/home.json`) with no network or keys.
    CI and the pixel gates use it.
  - Otherwise the build reads Contentful using the variables exported by direnv from `.envrc` (git-ignored):
    `CONTENTFUL_SPACE_ID`, `CONTENTFUL_DELIVERY_TOKEN`, `CONTENTFUL_ENVIRONMENT`.
  - The management token (`CONTENTFUL_MANAGEMENT_TOKEN`) is used only by the setup scripts.
- **Setup scripts:** always target a sandbox first; `master` is refused without `--approve`.
  ```bash
  pnpm cms:sandbox mig-001
  pnpm cms:migrate --env mig-001
  pnpm cms:seed --env mig-001
  ```
- **Model workflow:** edit or add a migration, then run `pnpm cms:model` (replays the migrations into
  `contentful/content-model.json`) and `pnpm cms:types`. `pnpm test` runs the mapping tests.

## Verify against the design (pixel-diff)

With `pnpm preview` running:

```bash
pnpm match:pages          # 7 pages × 5 widths, full-page
pnpm match:interactions   # 10 interactive states
```

Both must report MATCH (threshold 0.1%). Diffs land in `visual-diff-out/`. The design target renders through
`design/support.js`, a stand-in for the export's missing runtime; `public/assets/` holds placeholders until the
real image exports are dropped in (same file names).
