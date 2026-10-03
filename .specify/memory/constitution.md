<!--
Sync Impact Report
- Version: template (unratified) → 1.0.0 (initial ratification)
- Source: agents-kit preset `.specify/presets/agents-kit/templates/constitution.md`, adapted to this repo
- Principles: I Spec-first · II Detect before prescribe · III Verify, don't assume · IV Design fidelity is
  measured · V Content is data, layout is code · VI Plan-and-approve before irreversible work
- Adapted from the kit default (divergences, owner-chosen): Tailwind v4 instead of SCSS tokens; single app
  (no monorepo); static export, host-agnostic (no server runtime); Supabase not in use (rule kept, dormant);
  Storybook coverage not adopted (no Storybook here — the pixel gates are the UI regression check)
- Templates: plan-template.md "Constitution Check" derives gates from this file ✅ (no edit needed);
  spec-template.md / tasks-template.md ✅ no mandatory-section changes
- Deferred: none
-->
# Banister Website Constitution

The non-negotiable principles every spec, plan, task, and implementation in this repo must honor. If a
request conflicts with them, **flag the conflict** before proceeding. Derived from the agents-kit
knowledge base and adapted to this project's actual stack.

## Core Principles

### I. Spec-first (SDD)
Non-trivial work MUST be specified before it is built (constitution → specify → clarify → plan → tasks →
implement → validate); the spec is the source of truth. Trivial changes (copy tweak, one-file fix) skip
the lifecycle. *Spec quality = output quality.*

### II. Detect before prescribe
Match what this repo actually uses: **Next.js 16 App Router + TypeScript strict + Tailwind v4, single app,
static export**. Divergences from the agents-kit canonical stack (SCSS tokens, monorepo, Vercel) are
owner decisions recorded here — new work MUST follow the repo, not the kit default, and MUST flag any new
divergence rather than silently introducing it.

### III. Verify, don't assume
No claim of success without the command that proves it: `pnpm lint`, `npx tsc --noEmit`, `pnpm build`,
and the pixel gates below. Version-specific API guidance MUST come from current docs
(`node_modules/next/dist/docs/`, vendor docs), not memory; cite the source.

### IV. Design fidelity is measured
The approved design (`design/banister-v2.dc.html`) is the visual source of truth. Any change that can
affect rendering MUST keep `pnpm match:pages` (7 pages × 5 widths) and `pnpm match:interactions` (10
states) at **MATCH, threshold 0.1%**, run against the exact production build (`pnpm build:pages &&
pnpm preview`). A deliberate visual change updates the design first, or is recorded as an approved
deviation in its spec. The gate decides "matches" — never an eyeball.

### V. Content is data, layout is code
Editorial content (copy, images, lists, SEO) belongs in the CMS, not in components; components own only
layout, motion, and interaction. Content is fetched at **build time** — no request-time server features
(route handlers relying on Request, server actions, cookies, request-time `searchParams`), so the site
stays deployable to any static host.

### VI. Plan-and-approve before irreversible work
Content-model migrations, schema changes, repository/host settings, and deploys MUST be proposed as a
concrete plan, approved by the owner, and applied to a sandbox/branch first.

## Non-negotiables (acceptance gates)
- **Secrets:** never in tracked files — env-var references only. CMA/management tokens are build/CI-only
  and MUST never reach the client bundle; only values safe to publish may use `NEXT_PUBLIC_`.
- **Next.js:** Server Components by default; `'use client'` only at interactive leaves; no server-only or
  secret code reachable from a Client Component.
- **Styling (Tailwind v4 — owner-chosen divergence from the kit's SCSS default, 2026-09-29):** colours and
  fonts come from `@theme` tokens in `src/app/globals.css` (`navy`, `teal`, `gold`, …) — no raw hex in
  components when a token exists; arbitrary values (`text-[clamp(...)]`, `grid-cols-[...]`) only where they
  reproduce the design's exact values, verified by Principle IV. Preflight stays off (the design was
  authored against browser defaults).
- **Contentful:** editorial/marketing content only; `camelCase` singular content-type IDs and `camelCase`
  field IDs; reusable content as references; page composition via ordered block references; types
  generated with `cf-content-types-generator` (never hand-written); every model change is a
  `contentful-migration` script, shown and approved, run against a sandbox environment before `master`.
- **Supabase (dormant — not in use):** if app data is ever added, RLS default-deny per operation on every
  `public` table, `getUser()`/`getClaims()` only, `@supabase/ssr`, service keys server-only.
- **TypeScript strict.** No `any` without a written justification.
- **SEO & a11y:** per-page metadata; semantic landmarks; keyboard-operable controls with accessible
  names; reduced-motion respected where the design does.

## Definition of done (every feature)
- [ ] `pnpm lint`, `npx tsc --noEmit`, and `pnpm build:pages` pass (commands cited in the PR).
- [ ] Pixel gates MATCH at 0.1% against the production build, or an approved deviation is recorded.
- [ ] No secret reachable from the client bundle (grep the `out/` build for token prefixes).
- [ ] Styling uses theme tokens or design-exact arbitrary values only.
- [ ] Server/Client boundaries respected.
- [ ] Each spec acceptance criterion is validated; this constitution is not violated.

## Governance
This constitution supersedes other practices in this repo. Amendments are proposed in a PR that states
the change, the reason, and the version bump (MAJOR: principle removed/redefined; MINOR: principle or
section added/expanded; PATCH: wording). Every plan's "Constitution Check" gates on it, and every PR
review verifies compliance. Runtime guidance for agents lives in `AGENTS.md` and
`.specify/memory/project-context.md`.

**Version**: 1.0.0 | **Ratified**: 2026-09-30 | **Last Amended**: 2026-09-30
