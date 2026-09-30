# Contract: environment variables and CMS scripts

## Environment variables (FR-013)

Set these in `.envrc` locally (direnv, git-ignored) and in CI secrets. They are never committed and never
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
| `cms:model` | Replays the migrations into `contentful/content-model.json` (committed; always derived — the source of truth is `contentful/migrations/`). | none | 0 · 1 |
| `cms:types` | `cf-content-types-generator contentful/content-model.json -o src/types/contentful --response` | none | tool's exit code |
| `cms:seed [--env <id>] [--approve]` | Idempotently upserts assets and entries from `contentful/seed/` using deterministic IDs, then publishes them. It refuses `master` unless `--approve`. | management token | 0 · 1 · 2 |
| `cms:check` *(planned, not built yet)* | Builds with `CONTENT_SOURCE=contentful`, then runs the pixel gates, to prove SC-001 against a live environment. | delivery token, running preview | gate exit codes |

`dev`, `build` and `build:pages` run `cms:prepare` (`cms:model` → `cms:types` → `cms:assets`) first, so the model, types and images always match the migrations and the content source.
