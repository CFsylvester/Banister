# Banister International — website

Next.js 16 (App Router) + Tailwind v4 + TypeScript, built from `design/banister-v2.dc.html` and deployed to
GitHub Pages at **https://cfsylvester.github.io/Banister/**.

Requires Node ≥ 22.13 (pnpm 11): `nvm use 22`.

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:3000 (no base path)
```

## Deploy (GitHub Pages)

The site is a **static export** (`output: "export"` in `next.config.ts`) served under the `/Banister` sub-path.

- Every push to `main` runs `.github/workflows/pages.yml`, which builds with `PAGES_BASE_PATH` from
  `actions/configure-pages` and publishes `out/`.
- Repo setting required: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- Links via `next/link` get the base path automatically; images must go through `asset()` (`src/lib/asset.ts`) —
  the shared `<Img>` component already does.
- No server at runtime: no route handlers, server actions, or request-time `searchParams` (the contact page reads
  `?aud=` client-side). Forms currently simulate submission — wire them to a hosted form/API endpoint.

Preview the exact Pages build locally:

```bash
pnpm build:pages && pnpm preview   # http://localhost:3217/Banister/
```

## Verify against the design (pixel-diff)

With `pnpm preview` running:

```bash
pnpm match:pages          # 7 pages × 5 widths, full-page
pnpm match:interactions   # 10 interactive states
```

Both must report MATCH (threshold 0.1%). Diffs land in `visual-diff-out/`. The design target renders through
`design/support.js`, a stand-in for the export's missing runtime; `public/assets/` holds placeholders until the
real image exports are dropped in (same file names).
