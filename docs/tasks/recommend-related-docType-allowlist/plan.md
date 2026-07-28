# recommend-related-docType-allowlist Plan

## Impacted Areas
- `packages/wiki-core/src/lib/aiOrchestration.ts` (2 filters: `rankingRecommendedDocuments`, `aiRecommendedDocuments`)
- `apps/web/src/ui/pages/ArticleAskPanel.tsx` (`suggestedNextPages` render filter)
- `apps/web/src/ui/searchRecommendations.ts` (`buildFallbackRecommendedDocuments`)
- `apps/web/src/ui/searchRecommendations.test.ts`, `apps/web/src/ui/pages/ArticleAskPanel.test.tsx` (new regression tests)
- `docs/prd/search-flow-contract.md`

## Technical Approach
Replace every exclusion-list docType check (`dt === "nav" || dt === "ops" || ...`) feeding the "추천 페이지"/"관련 페이지" surfaces with an inclusion check (`dt === "guide" || dt === "page"`). Left untouched: `isIndexWikiDocument`'s own nav-only definition (still correct for its actual purpose — index-expansion candidate discovery, not recommendation-list membership), the guide index graph view, and AI-ask/search prompt-context construction (different concern: what the AI reads to answer, not what page cards are displayed).

`ArticleAskPanel.tsx`'s `suggestedNextPages` map also simplified: since the inclusion check already requires `document` to exist (docType read from it), the previous "document not found → render an unlinked card" fallback branch became dead code and was removed.

## Validation Plan
- `pnpm -r typecheck`/`test`/`build`.
- New unit tests: `buildFallbackRecommendedDocuments` excludes faq/library/nav given a full docType-mixed candidate set; `ArticleAskPanel`'s suggested pages renders a guide-doctype page but not a faq-doctype page from the same AI response.
- Live verification: redeploy `ai-search` Lambda, ask a question whose answer explicitly references the FAQ index page, confirm the index document itself does not appear in `recommendedDocuments`/`relatedDocuments`.

## Risks
- None — this narrows an already-intended exclusion set to be more robust (whitelist vs. blacklist), not a new behavior expansion.
