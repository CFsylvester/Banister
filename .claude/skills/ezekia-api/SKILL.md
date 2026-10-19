---
name: ezekia-api
description: >-
  Ezekia (executive-search CRM) REST API v4 — use whenever code calls,
  integrates, or syncs Ezekia: people, candidates, projects/assignments,
  companies, notes, tasks, billing, custom fields, the v1/v2 → v4 migration.
---
# Ezekia API — integrating with the search-firm CRM

Ezekia is CRM software for executive-search firms. Its API is a single OpenAPI 3 document. This skill is a
**generated, hash-pinned projection** of that document, so it can be re-synced when Ezekia changes the API:

- **Live spec (source of truth):** https://ezekia.com/docs?api-docs.json — the Swagger UI at
  https://ezekia.com/api/documentation loads it (read from the page source, 2026-10-01).
- **This skill's snapshot:** `references/index.md` (spec `info.version`, full sha256, snapshot date, op counts).

## Hard rules
1. **Look the operation up before writing the call. Never guess a path, param or field.** The API has
   250+ current operations. Path shapes are irregular (e.g. candidate pipeline routes live under
   `/assignments/...`, not `/projects/...`). Open `references/index.md`, then the one `references/current/<tag>.md`
   file you need.
2. **Call `/api/v4/...`, except the few version-free paths** the references list without a `/vN` prefix (today only
   `GET /api/categories`). The spec calls these "deliberate exceptions … unaffected by these removals", and they
   have no `/v4` twin. v1 and v2 are deprecated, and the spec says they are removed on **1 January 2027**.
   That includes **unversioned** calls such as `/api/people`, which v1 serves. Moving to v4 is not always a
   drop-in change: a later version may redefine the request or response. Check the operation's entry, and use
   `references/deprecations.md` to map old → new. *(Source: the spec's `info.description` + per-op descriptions.)*
3. **The token is a server secret.** Auth is the spec's single scheme, `api.bearer` (HTTP bearer). Send
   `Authorization: Bearer <token>` from server-only code (route handler, server action, `import 'server-only'`,
   a job). Never put it in a client component, a `NEXT_PUBLIC_*` var or a log. Keep it in an env var
   (e.g. `EZEKIA_API_TOKEN`). Never commit a literal.
4. **Expect spec inconsistencies and don't paper over them.** Many path templates use placeholders that the
   spec documents under a different name (e.g. `{assignmentId}` documented as `id`). The reference files mark
   these `⚠️ Spec inconsistency`. When the counts line up they give a likely positional mapping. Otherwise they
   list the declared-but-absent params (often a spurious `type`/`id`), and you infer the placeholder from the path
   segment name. Either way, verify with a real call (`GET` first) before relying on it.
5. **Paginate explicitly.** List endpoints take the shared `page` / `count` params and return `data` plus `links`
   (`first`/`last`/`next`/`prev`) and `meta` (`currentPage`, `lastPage`, `total`, …). See
   `references/conventions.md`. Validation failures return `422` with `{ message, errors }` (`api.422`).

## Find an endpoint
The references are ordinary markdown. Claude Code auto-activates the skill from its description. Load only the
file you need:

| need | file |
|---|---|
| snapshot, versions, tag → file map | `references/index.md` |
| auth, shared query params (`query`, `fuzzy`, `filterOn[]`, `fields`, `sortBy`, `view`, …), common schemas | `references/conventions.md` |
| one resource's operations + their schemas | `references/current/<tag>.md` (e.g. `people-profile.md`, `projects-candidates.md`) |
| migrating a v1/v2/unversioned call | `references/deprecations.md` |

Read the file straight from this folder: `.claude/skills/ezekia-api/references/`.

## Minimal call (server-side, TypeScript)
```ts
import 'server-only'
const BASE = 'https://ezekia.com/api/v4'          // servers[0] in the spec + the v4 prefix

export async function ezekia<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.EZEKIA_API_TOKEN}`, Accept: 'application/json',
               'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) throw new Error(`Ezekia ${init.method ?? 'GET'} ${path} → ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

// smoke test — the cheapest authenticated call: returns { id, email, fullName } of the token's user; 401 = bad token
const me = await ezekia<{ id: number; email: string; fullName: string }>('/me')
```

## CV / resume parsing
Ezekia parses a CV itself. You send the file and it fills in the person's profile. Sources: the live spec
(`info.version` 2.1.1, read 2026-10-19) and Ezekia's help article *API Integration*
(https://ezekia.freshdesk.com/support/solutions/articles/101000510621-api-integration). The article's examples use
v2 paths, but the v4 operations accept the same multipart body.
- **Create from a CV.** Call `POST /api/v4/people` with `multipart/form-data`, using the body variant
  `api.person.storeFile` ("Person Store with Resume Body"). `resume` (binary) is required. `ownerId`, `lists` (integer array),
  `projectId` and `projectType` (`assignment` | `opportunity` | `list`) are optional. The article says the CV
  "will automatically be parsed" and that no other data needs to be sent. See `references/current/people-profile.md`.
- **Update from a CV overwrites.** `PUT /api/v4/people/{personId}` takes the same multipart variant. The article
  warns that "it will replace existing data with that from the CV". To keep a CV on file without changing the
  profile, upload it as a document (`POST /api/v4/people/{personId}/documents`). The UI has the same split between
  "Upload as a Document" and "Parse the CV"
  (https://ezekia.freshdesk.com/support/solutions/articles/101000530667-how-to-upload-a-cv-or-resume-to-a-candidates-profile).
- **No automatic de-duplication.** Neither source says Ezekia merges duplicates. The article makes the integrator
  check first: look the person up by email (`GET /api/v4/people?query=<email>&filterOn[]=email`; `filterOn[]`
  accepts `email` in the spec), then update the match or create a new person. It also notes that the same email
  can exist on several people, so decide which record to use.
- **Rate limit: 5 requests per second**, which allows up to 300 per minute. Going over returns
  `429 Too Many Requests`, so throttle or back off (article, "Important: API Rate Limit"). The spec does not
  mention the limit.
- **No bulk upload.** The article says "The API does not support bulk uploads". Send one CV per request within the
  rate limit, or use the platform's file import feature.

## Credentials to request (what the spec does and doesn't say)
The spec confirms only that requests use a bearer token and that the token acts as a user (`/v4/me`). Ask
Ezekia or the firm's admin for:
1. **A bearer token for a dedicated integration user**, not a person's own login. Give it the narrowest
   role that works, because the token inherits that user's visibility.
2. **How tokens are issued and how long they last.** `[unverified]` The Swagger page configures an OAuth2
   redirect (`https://ezekia.com/api/oauth2-callback`), but the spec declares no OAuth2 scheme, token URL or
   scopes. Ask whether it's a personal access token or an OAuth2 client (client ID/secret, token URL, redirect
   URI, scopes) and whether tokens expire or refresh.
3. **A sandbox/test tenant.** `[unverified]` The spec doesn't mention one. The rate limit (5 requests per second)
   is documented in the help centre (see *CV / resume parsing* above), not in the spec.
4. **Confirmation the account can use v4** before the 2027-01-01 removal of v1/v2.
Spec contact: `support@ezekia.com` (`info.contact`).

## Keeping it current (Ezekia updates its docs)
The references are **generated, never hand-edited**. `scripts/ezekia-sync.mjs` fetches the live spec and
projects the *current* surface: for each endpoint, the highest non-deprecated version. `references/index.md` pins
three sha256 hashes: the **spec**, the **generator script** and the **rendered tree**. A spec change, a script
edit without a regenerate, and a hand edit are each reported as drift.

```bash
# drift check against the live spec: exit 0 in sync · 1 drift (lists added / removed / newly-deprecated ops) · 2 spec unreachable
pnpm ezekia:check
# refresh: regenerate references/ from the live spec
pnpm ezekia:sync
# self-test + offline pins (generator + tree, no network) — what CI runs
pnpm ezekia:test
```
CI (`.github/workflows/ci.yml`) runs `pnpm ezekia:test` on every PR and every push to `main`, so a hand edit or a generator change
without a regenerate fails the build. Nothing checks the live spec on a schedule. Run `pnpm ezekia:check` before
starting Ezekia work, and `pnpm ezekia:sync` if it reports drift.

## Sources
- **Ezekia OpenAPI spec**: https://ezekia.com/docs?api-docs.json. This is the vendor's own machine-readable API definition, which its Swagger UI (https://ezekia.com/api/documentation) loads. Every path, param and schema in `references/` comes from it.
- **Ezekia help centre, "API Integration"**: https://ezekia.freshdesk.com/support/solutions/articles/101000510621-api-integration. Written by the vendor and modified 12 Oct (no year shown). It is the source for CV parsing over the API, overwrite-on-update, the email-first dedup advice, the 5 requests per second limit and the lack of a bulk API. Read 2026-10-19.
- **Ezekia help centre, "How to upload a CV or resume to a candidates profile"**: https://ezekia.freshdesk.com/support/solutions/articles/101000530667-how-to-upload-a-cv-or-resume-to-a-candidates-profile. Written by the vendor and modified 2025-08-22. It covers the UI split between "Upload as a Document" and "Parse the CV". Read 2026-10-19.
- **Excluded**: the Capterra, Slashdot and spott.io comparison pages. They are third-party aggregators, and they disagree on whether Ezekia parses CVs at all.
