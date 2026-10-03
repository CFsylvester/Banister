# Quickstart: prove the CMS integration end to end

Validation guide. Commands and variables are defined in [contracts/env-and-scripts.md](contracts/env-and-scripts.md).
All Contentful variables live in `.envrc` (direnv, git-ignored). They are never written inline in commands
or docs.

## A. Offline (no Contentful account yet): proves the mapping layer and pixel parity

Set `CONTENT_SOURCE` to `fixture` in `.envrc`, then:

```bash
nvm use 22 && pnpm install
pnpm build:pages && pnpm preview          # http://localhost:3217/Banister/
pnpm match:pages && pnpm match:interactions
pnpm test                                  # mapping-layer unit tests
```

Expected:
- ALL PAGES MATCH across 35 page checks and ALL INTERACTIONS MATCH across 10, with 0% drift. That's
  SC-001 offline: the CMS-shaped data renders identically to today.
- The tests pass.

## B. Fresh space (owner has created the account, space and tokens)

1. Put the space ID, delivery token and management token in `.envrc`, and remove the fixture
   setting.
2. Create a sandbox and apply the model there first:
   ```bash
   pnpm cms:sandbox mig-001
   pnpm cms:migrate --env mig-001        # prints a summary, applies to the sandbox
   pnpm cms:seed --env mig-001
   ```
3. Point the build at the sandbox: set `CONTENTFUL_ENVIRONMENT` to `mig-001` in `.envrc` (direnv). Then:
   ```bash
   pnpm build:pages && pnpm preview
   pnpm match:pages && pnpm match:interactions               # expect MATCH
   ```
4. **Owner approval**, then promote to master (and set `CONTENTFUL_ENVIRONMENT` back to `master` in `.envrc`):
   ```bash
   pnpm cms:migrate --env master --approve && pnpm cms:seed --env master --approve
   ```
5. **Idempotency:** run `pnpm cms:seed --env mig-001` again. It should report 0 created and only
   updates or no-ops.

## C. Editor scenarios (spec US2–US4), on the sandbox

| Scenario | Action in Contentful | Expected after rebuild |
|---|---|---|
| Headline | Bold a different word in `homePage.heroHeadline` | That word renders teal |
| List order | Drag `statistic` #4 to the top | The stats grid shows it first, and the count-up still runs |
| Bio | Add a paragraph to Patrick's `fullBio` | It appears in "Read full bio", and expand/collapse works |
| New article | Create an `insightArticle` with slug `test-article`; add it to `insightsPage.articles` | `/insights/test-article/` exists, and its card links there |
| Newsroom external | Set a `newsItem.externalUrl` | "Learn more" opens it in a new tab |
| Newsroom invalid | Set both `article` and `externalUrl` | The build fails, naming the entry (FR-009/FR-017) |
| Arrangeable | Move about's leadership section above the hero | The rendered order changes |
| SEO | Leave `seo` empty on industries | The site-wide default title and description are used |

## D. Security check (SC-006)

After a live build, scan `out/` for the delivery and management token values held in `.envrc`,
using a small script that reads them from the environment so they never appear on the command line. It
must find nothing. The token formats are whatever the owner's tokens actually look like `[unverified]`,
so the scan matches exact values rather than guessing a prefix.
