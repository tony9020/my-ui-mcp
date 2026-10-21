# Scoring

## Licence classification (`licenseClass`)

| Class | Licences |
| --- | --- |
| `first-party` | My Ui's own local components |
| `permissive` | MIT, MIT-0, Apache-2.0, BSD, ISC, 0BSD, Zlib, Unlicense, and "FREE …" variants |
| `weak-copyleft` | MPL-2.0, LGPL, EPL, CDDL, EUPL |
| `strong-copyleft` | AGPL, GPL |
| `restricted` | Commons Clause, proprietary, "free with attribution required", custom unclear |
| `none` | NO-LICENSE |
| `unknown` | anything else |

Default licence policy is `permissive-only`: only `first-party` and `permissive` records are returned. `allow-weak-copyleft` adds `weak-copyleft`; `any` returns everything. Excluded records are counted and reported (`excludedForLicence`), never silently dropped.

## Trust tiers

- `verified` — My Ui's own local components (typed source, parsed with the TS AST).
- `linked` — catalogue record with a `sourceUrl` (15 of 8,157).
- `reference` — catalogue record with no `sourceUrl` (8,142 of 8,157). Treat as an illustrative approximation.

## Compliance score (0–100)

Starts at 100. Deductions:

- −20 if `trustTier === "reference"`
- −15 if the code uses `animate-[...]` keyframes not defined in this project
- −10 if the demo does not import the component it claims to show
- −10 if there is no reduced-motion handling
- −5 per declared-but-unused dependency (capped at 20)
- −10 if the code uses hardcoded colours instead of semantic tokens
- −5 if the aria score is below 0.2
- −10 if the licence class is `none`, `restricted` or `strong-copyleft`
- +5 if `trustTier === "linked"`

Clamped to [0, 100].

## Popularity score (0–1)

Normalised composite of log-scaled signals, because `downloads` (median 9) and
`likes` (94% zero) alone are poor discriminators — they have almost no
variance. Views (median ~12k) and bookmarks (median 16) carry more signal.

- `viewsN = log10(views+1) / log10(maxViews+1)`
- `bookmarksN = log10(bookmarks+1) / log10(maxBookmarks+1)`
- `downloadsN = log10(downloads+1) / log10(maxDownloads+1)`
- `likesN = log10(likes+1) / log10(maxLikes+1)`
- `popularity = 0.35*viewsN + 0.25*bookmarksN + 0.20*downloadsN + 0.20*likesN`
- +0.05 recency boost if `updatedAt` is within 90 days of the catalogue's
  `generatedAt`.

## Final search ranking

`final = base * trustWeight * (0.7 + 0.3*popularity) * (0.8 + 0.2*compliance)`

where `trustWeight` is 1.2 (verified), 1.05 (linked) or 0.85 (reference), and
`base` is MiniSearch relevance (scaled) plus slug/name prefix bonuses (+15 each)
and a local boost (+25) applied only when base relevance is at least 20
(relevance-aware local-first rule: a clearly better catalogue match can surface,
labelled with its trust tier).

## Deduplication

Records are collapsed when they share a code hash **or** a normalised name
(union-find). The canonical record is chosen by: has `sourceUrl` > higher
`popularityScore` > newer `updatedAt` > id. Non-canonical records carry
`duplicateOf` and `alternates[]`. Collapsed by default; `include_duplicates: true`
to see them.

## Related components

Ranked by `sharedTags*2 + sharedCategories*3 + sharedProps`, over the shared
primary-category bucket (capped at 200 candidates for speed). Non-canonical
records are excluded. Each result carries a `score` and `reasons[]`.
