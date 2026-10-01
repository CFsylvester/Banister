# Feature Specification: Publish in Contentful → live in seconds (Vercel)

**Feature Branch**: `002-vercel-publishing` · **Created**: 2026-10-01 · **Status**: Built (offline-verified); live setup pending Banister's Vercel account

**Input**: Owner: "when a page or content is published in the correct environment it gets updated for the live almost
immediately." The domain cannot move to Cloudflare, so the site is hosted on Vercel Pro (Banister-owned team). Staging is
deferred to [issue #3](https://github.com/CFsylvester/Banister/issues/3); scope is `master` → live only.

## Requirements
- **FR-1**: Publishing or unpublishing any entry or asset in the live Contentful environment updates the live site. The very next request shows the change, with no rebuild.
- **FR-2**: Publishes in any other environment (sandboxes) do not change the live site.
- **FR-3**: Only Contentful can trigger a refresh. A shared secret is sent as a Contentful *secret header*; wrong, missing or unconfigured secrets are rejected.
- **FR-4**: The offline fixture (`CONTENT_SOURCE=fixture`) still builds and renders with no network or keys. CI and the pixel gates use it.
- **FR-5**: The site stays pixel-identical to the design (all pages × 5 widths, 10 interaction states, 0.1%).
- **FR-6**: Images published after a deploy still render. Live pages use Contentful's image CDN, and the fixture uses local copies.
- **FR-7**: Banister's domain stays at its current DNS provider.

## Design (what was built)
- `next.config.ts`: `cacheComponents: true`. Static export and `basePath` removed; `trailingSlash` kept.
- `src/lib/cms/source.ts`: `getPage()` is `'use cache'`, with `cacheLife("max")` (a 30-day safety refresh) and `cacheTag("cms")`.
- `src/app/api/revalidate/route.ts`: `POST` checks the request through `judgeWebhook()` (`src/lib/cms/webhook.ts`, unit-tested), then calls `revalidateTag("cms", { expire: 0 })`.
- `scripts/cms/webhook.mjs` (`pnpm cms:webhook`): creates or updates the webhook with topics `*.publish`/`*.unpublish`, a filter on `sys.environment.sys.id`, and the secret header.
- CI replaces the GitHub Pages deploy. Vercel's Git integration deploys.
- Constitution amended to 2.0.0 (Principle V).

Sources (first-party, verified 2026-10-01):
- Next 16 docs in `node_modules/next/dist/docs/` (revalidateTag, cacheTag, cacheLife, cacheComponents).
- [Vercel ISR](https://vercel.com/docs/incremental-static-regeneration)
- [Vercel custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- contentful-management 12.19.0 typings (webhook topics, filters, secret headers)

## Acceptance (evidence)
| Check | Result |
| --- | --- |
| Production server: content changed, no publish | Still serves the cached page ("Companies") |
| `POST /api/revalidate`, wrong secret | 401 |
| Publish payload for sandbox `mig-001` | 202, ignored; page unchanged |
| Publish payload for `master` | 200; **very next request** shows the new content ("Careers") |
| Pixel gates on the server build | ALL PAGES MATCH (35/35), ALL INTERACTIONS MATCH (10/10), 0% |
| `pnpm test` / lint / tsc / fixture build | 21/21 · clean · clean · pass |

## Pending (needs Banister and the owner)
1. Banister creates the Vercel Pro team and invites Claire (doc sent separately).
2. Import the repo into Vercel. Set the Production env vars: the space ID, the delivery token, the environment (set to `master`), and the revalidate secret.
3. `pnpm cms:webhook --url https://<site>/api/revalidate --env master --approve`. Then publish a test change and time it.
4. Add the DNS record at Banister's DNS provider.

## Unverified (to check on the live setup)
- `*.unpublish` as a topic name.
- Whether the publish payload carries `sys.environment.sys.id`. The route accepts payloads without it; the secret header alone decides.
- Real publish → visible latency on Vercel.
