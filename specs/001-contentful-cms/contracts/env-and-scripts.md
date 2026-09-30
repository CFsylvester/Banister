# Contract: environment variables and CMS scripts

## Environment variables (FR-013)

Set these in `.env.local` locally (git-ignored) and in CI secrets. They are never committed and never
prefixed `NEXT_PUBLIC_`.

| Variable | Used by | Scope |
|---|---|---|
| `CONTENTFUL_SPACE_ID` | build, scripts | identifier (not secret, but kept in env) |
| `CONTENTFUL_ENVIRONMENT` | build, scripts | default `master`; a sandbox ID for verification |
| `CONTENTFUL_DELIVERY_TOKEN` | build | read-only Content Delivery token, scoped to the environments the build reads |
| `CONTENTFUL_MANAGEMENT_TOKEN` | scripts only | write access (migrations, seed, export). **Never read by app code.** |
| `CONTENT_SOURCE` | build | `contentful` (default) or `fixture`. `fixture` reads `contentful/seed/` and needs no credentials. |

A build with `CONTENT_SOURCE` unset or `contentful` and missing credentials MUST exit non-zero with a
message naming the missing variable.

## Scripts (`package.json`)

| Script | Does | Needs | Exit codes |
|---|---|---|---|
| `cms:sandbox <id>` | Creates the sandbox environment `<id>` by cloning `master`. | management token | 0 created or exists · 1 API error · 2 usage |
| `cms:migrate [--env <id>] [--approve]` | Applies pending `contentful/migrations/NNNN-*.ts` in order and records what was applied. It prints a plain-language summary first. It refuses `master` unless `--approve` is passed. | management token | 0 ok · 1 migration failed · 2 usage or refused |
| `cms:export-model [--env <id>]` | Writes the content types to `contentful/content-model.json` (committed). | management token | 0 · 1 |
| `cms:types` | `cf-content-types-generator contentful/content-model.json -o src/types/contentful --response` | none | tool's exit code |
| `cms:seed [--env <id>] [--approve]` | Idempotently upserts assets and entries from `contentful/seed/` using deterministic IDs, then publishes them. It refuses `master` unless `--approve`. | management token | 0 · 1 · 2 |
| `cms:check` | Builds with `CONTENT_SOURCE=contentful`, then runs the pixel gates, to prove SC-001 against a live environment. | delivery token, running preview | gate exit codes |

`prebuild` runs `cms:types`, so `tsc` and `next build` always see types that match the committed model.
