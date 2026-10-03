# Data Model: Contentful content types

Conventions (constitution; kit Contentful skill):
- Content-type IDs are singular `camelCase`. Field IDs are `camelCase`.
- Every type has a display field (`title`, `name` or `internalName`).
- Reusable content is a **reference**. Page composition uses ordered references.
- Unless noted, text fields are required and list fields have `min: 1`.

Legend:
- **Sym**: Symbol, a short text field (max 256 chars).
- **Txt**: long text.
- **RT(h)**: rich text restricted to paragraphs plus the bold mark. It's used for headlines, and bold
  renders teal.
- **RT(body)**: rich text with paragraphs, bold, italic, hyperlinks and quote. A quote renders as the
  pull-quote block.
- **Ref→X**: a link to type X. **Refs→X**: an ordered list of links to X.
- **Img**: a linked image asset with alternative text. Assets store a title and a description; the
  description is used as the alt text.

## Shared / site-wide

| Type | Fields | Validations / notes |
|---|---|---|
| `siteSettings` (singleton) | `internalName` Sym · `siteName` Sym · `logo` Img · `navigation` Refs→`navigationLink` · `headerCta` Ref→`navigationLink` · `footerColumns` Refs→`footerColumn` · `socialLinks` Refs→`socialLink` · `regionsTagline` Sym · `copyright` Sym · `legalLinks` Refs→`navigationLink` · `newsletterPrompt` Sym · `newsletterPlaceholder` Sym · `defaultSeo` Ref→`seo` | Exactly one entry, seeded with the fixed ID `siteSettings`. |
| `navigationLink` | `label` Sym · `href` Sym | `href` must be a site path from the route list (see contracts/routes.md) or `https://…`. |
| `footerColumn` | `title` Sym · `titleLink` Ref→`navigationLink` · `links` Refs→`navigationLink` | |
| `socialLink` | `label` Sym · `icon` Img · `href` Sym (optional) | With no `href`, the icon doesn't link, as the design has it today for LinkedIn. |
| `seo` | `title` Sym (optional) · `description` Txt (optional, ≤ 300) · `shareImage` Img (optional) | Empty fields fall back to `siteSettings.defaultSeo` (FR-007). |
| `tag` | `label` Sym | Unique. The first tag on a card renders highlighted (a design rule, kept in code). |
| `testimonial` | `internalName` Sym · `quote` Txt · `attribution` Sym | Reused on home and industries. |
| `statistic` | `value` Integer (≥ 0) · `suffix` Sym (optional, e.g. "+", "%") · `label` Sym | Numeric, so it can count up. |

## Fixed pages (FR-008: section order fixed, all content editable)

| Type | Fields |
|---|---|
| `homePage` (singleton) | `heroHeadline` RT(h) · `heroCtaLabel` Sym · `heroCtaLink` Ref→`navigationLink` · `heroSlides` Refs→Img (1–6) · `introLead` Txt · `introBody` Txt · `statsHeading` Sym · `stats` Refs→`statistic` · `testimonialsHeading` Sym · `testimonials` Refs→`testimonial` · `insightsHeading` Sym · `featuredInsights` Refs→`insightArticle` (0–3) · `seo` Ref→`seo` |
| `insightsPage` (singleton) | `heading` Sym · `articles` Refs→`insightArticle` (curated, FR-018) · `newsroomHeading` Sym · `newsItems` Refs→`newsItem` · `seo` Ref→`seo` |
| `contactPage` (singleton) | `heading` Sym · `candidateTabLabel` Sym · `employerTabLabel` Sym · `candidateIntro` Txt · `employerIntro` Txt · `candidateMessageLabel` Sym · `employerMessageLabel` Sym · `consentText` Txt · `thanksTitle` Sym · `thanksTitleNoName` Sym · `thanksBody` Txt · `thanksBodyNoEmail` Txt · `seo` Ref→`seo` |

`thanksTitle` and `thanksBody` support the placeholders `{firstName}` and `{email}` (FR-019). The
`…NoName` / `…NoEmail` variants are used when the value is empty.

Form field labels ("First name", "Email address", …) are part of the form's mechanics and stay in code
(FR-001 exceptions). This is a judgment call to revisit if editors ask for it.

## Arrangeable pages (FR-008: editors order the sections)

| Type | Fields | Notes |
|---|---|---|
| `page` | `internalName` Sym · `slug` Sym · `sections` Refs→any `section*` type · `seo` Ref→`seo` | `slug` must be one of `services`, `industries` or `about`, and is unique. New routes are out of scope. |
| `sectionSplitHero` | `internalName` Sym · `image` Img · `heading` Sym · `lead` Txt · `body` Txt (optional) · `ctaLabel` Sym · `ctaLink` Ref→`navigationLink` | |
| `sectionServiceGrid` | `internalName` Sym · `services` Refs→`service` | |
| `service` | `title` Sym · `paragraphs` RT(body) · `isHighlighted` Boolean · `linkLabel` Sym (optional) · `link` Ref→`navigationLink` (optional) | A highlighted service uses the dark card and shows the link. |
| `sectionMethodology` | `internalName` Sym · `heading` Sym · `intro` RT(body) · `drivers` Refs→`methodologyDriver` | Bold in the intro renders navy, like the design's "four key drivers". |
| `methodologyDriver` | `title` Sym · `body` Txt · `image` Img | |
| `sectionIndustryGrid` | `internalName` Sym · `heading` Sym · `industries` Refs→`industry` | |
| `industry` | `name` Sym · `icon` Img | |
| `sectionTestimonials` | `internalName` Sym · `heading` Sym · `testimonials` Refs→`testimonial` | Reuses the carousel. |
| `sectionLeadership` | `internalName` Sym · `heading` Sym · `people` Refs→`person` | |
| `person` | `name` Sym · `role` Sym · `portrait` Img · `leadParagraph` Txt · `fullBio` RT(body) (optional) | The expand control appears only when `fullBio` has content. |
| `sectionRichText` | `internalName` Sym · `heading` Sym (optional) · `body` RT(body) | A new block (a design-consistent text band); not used on seeded pages. |

## Articles and news

| Type | Fields | Validations |
|---|---|---|
| `insightArticle` | `title` Sym · `slug` Sym · `kind` Sym ∈ {`White paper`, `Article`} · `publishedDate` Date · `tags` Refs→`tag` · `coverImage` Img · `heroImage` Img (optional; falls back to the cover) · `summary` Txt · `dek` Txt · `authors` Sym · `body` RT(body) · `authorBios` Txt (optional) · `downloadLabel` Sym (optional) · `downloadFile` asset (optional) · `relatedReading` Refs→`insightArticle` (optional, ≤ 3) · `seo` Ref→`seo` | `slug` is unique and matches `^[a-z0-9]+(-[a-z0-9]+)*$` (FR-004). The date is shown as "Month YYYY". |
| `newsItem` | `title` Sym · `publishedDate` Date · `tags` Refs→`tag` · `image` Img · `article` Ref→`insightArticle` (optional) · `externalUrl` Sym (optional) | **Exactly one** of `article` or `externalUrl` (FR-009). The content model can't express this rule, so the mapping layer enforces it and fails the build naming the entry. `externalUrl` must start with `https://`. |

The article page's "Also of interest" aside becomes the `relatedReading` list plus an optional `sectionRichText`-style
note `[decide at tasks: model as article field vs site-wide]`.

## Relationships (summary)

```
siteSettings ─┬─ navigation/headerCta/legalLinks → navigationLink
              ├─ footerColumns → footerColumn → navigationLink
              ├─ socialLinks → socialLink
              └─ defaultSeo → seo
homePage → statistic*, testimonial*, insightArticle*(≤3), heroSlides(asset*)
insightsPage → insightArticle*, newsItem*
page(services|industries|about) → section* → service*/methodologyDriver*/industry*/testimonial*/person*
newsItem → insightArticle? XOR externalUrl
insightArticle → tag*, relatedReading insightArticle*
```

## Seed mapping (FR-011)

Every entry is created with a deterministic ID derived from its type and a stable key, for example
`statistic-placements` or `person-patrick-sylvester`, so re-running the seed updates entries rather than
duplicating them.

Sources for the seed:
- `src/lib/content.ts`
- the literal copy in `src/app/**/page.tsx`
- `src/components/*` (headings, CTA labels)
- the images in `design/assets/`

The white paper at `/insights/state-of-talent-acquisition` becomes `insightArticle`
`state-of-talent-acquisition`, and every current "Learn more" is seeded to point at it. This reproduces
today's links exactly.
