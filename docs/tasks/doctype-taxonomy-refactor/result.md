# result.md — doctype-taxonomy-refactor

## Delivered Scope

Replaced the 12-type docType taxonomy (`guide`, `tutorial`, `howto`, `concept`, `overview`, `troubleshooting`, `example`, `reference`, `nav`, `index`, `ops`, `policy`) with a 5-type taxonomy: `nav`, `guide`, `page`, `policy`, `ops`.

## Changes by Layer

### Type definitions
- `RawConfluencePage["metadata"]["docType"]` — 5-type union
- `WikiDocument["metadata"]["docType"]` — 5-type union

### Search scoring (`wikiDocuments.ts`)
- `isIndexWikiDocument`: single check `docType === "nav"`
- `getSearchDocTypeAffinity`: rewritten for 5 types — `guide` boosted for concept/planning queries, `page` for setup/troubleshooting queries, `nav` and `policy` penalized/excluded
- `rankSearchDocumentsIn`: pre-filters `ops` documents before scoring

### UI filters
- `CategoryPage`: `HIDDEN_DOC_TYPES = {"nav", "ops", "policy"}`; guides category shows only `guide` type
- `searchRecommendations`: filters `policy` from user-facing results
- `ArticleAskPanel`: suppresses `suggestedNextPages` for `nav` and `ops` articles
- `guideIndexGraph`: uses `isIndexWikiDocument` (docType === "nav") to identify index roots
- `vite.config` API handler: replaces ad-hoc slug pattern filters with `docType === "nav" || docType === "ops"` check

### Data sources
- `confluenceClient.ts`: `readDocType` validates new 5 types; `resolveCategory` simplified (policy/ops → library, all else → guides); `inferMetadataFromTitle` updated
- `wikiDataSource.ts`: `readDocType` updated; ops/policy separation maintained
- `confluenceSnapshots.ts`: all snapshot fixtures updated to new types

### UI labels
- `WikiDocumentListItem.DOC_TYPE_LABELS`: maps all 5 types to Korean labels

## Decisions

- `guide` replaces `tutorial`, `howto`, `overview`, `concept` — broad narrative docs that belong in primary recommendations
- `page` replaces `example`, `reference`, `troubleshooting` — specific detail pages accessible via guide links
- `nav` replaces `index`, `router`, `registry` — navigation-only, used for AI context and graph routing, not shown to users
- `resolveCategory` no longer infers category from docType variants; category is `"library"` for policy/ops, `"guides"` for everything else
- Old category inference for `projects`/`faq` based on docType is removed; those categories are assigned via Confluence space structure or explicit metadata

## Gaps / Notes

- Confluence pages in production that still carry old docType values (e.g. `tutorial`, `example`) will be rejected by `readDocType()` at fetch time. Migration of Confluence property values must be completed before enabling remote fetch.
- The `resolveCategory` simplification means pages previously categorized as `"projects"` via `example` docType now resolve to `"guides"`. This is acceptable while the category field comes from explicit Confluence space mapping rather than docType inference.
