# Contract: routes (static export, `trailingSlash: true`, under `basePath`)

| Route | Source | Composition |
|---|---|---|
| `/` | `homePage` | fixed |
| `/services/` | `page` (slug `services`) | arrangeable sections |
| `/industries/` | `page` (slug `industries`) | arrangeable sections |
| `/about/` | `page` (slug `about`) | arrangeable sections |
| `/insights/` | `insightsPage` | fixed |
| `/insights/<slug>/` | each published `insightArticle`, via `generateStaticParams` (R1) | fixed article template |
| `/contact/` (`?aud=employer\|candidate`) | `contactPage` | fixed; audience read client-side (unchanged) |

- **Removed route:** `/insights/state-of-talent-acquisition/` still resolves. It's now the seeded
  article's slug, not a hard-coded page.
- **Links:**
  - `navigationLink.href` values that start with `/` are site paths and go through `next/link`, which
    applies `basePath`.
  - `https://` values render as external links opening in a new tab, with `rel="noopener noreferrer"`.
- **Pixel gate:** `scripts/match-design.mjs` keeps the path
  `/insights/state-of-talent-acquisition` for the "article" page. It is valid because the seed preserves
  that slug.
