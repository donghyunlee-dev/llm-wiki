# recommend-related-docType-allowlist Result

## Delivered Scope
Fixed `[FAQ] Index` (and any other non-`nav`-docType index/hub document) leaking into the "추천 페이지"/"관련 페이지" sections of AI search and the Ask panel. Switched the docType check from an exclusion list (`nav`/`ops`/`policy`/`playbook`) to an inclusion allowlist (`guide`/`page` only) across all three places these lists get built: AI search's server-side ranking/AI-picked candidates, the Ask panel's `suggestedNextPages` render filter, and the client-side fallback recommendation builder.

## Changed Files
- `packages/wiki-core/src/lib/aiOrchestration.ts`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`
- `apps/web/src/ui/searchRecommendations.ts`
- `apps/web/src/ui/searchRecommendations.test.ts`, `apps/web/src/ui/pages/ArticleAskPanel.test.tsx`
- `docs/prd/search-flow-contract.md`
- `docs/tasks/recommend-related-docType-allowlist/` (new)

## Key Decisions
- User explicitly chose the allowlist approach over adding more exclusion checks (e.g., a generic title-based "ends with Index" detector) — simpler, and structurally immune to future docType additions leaking through the same way `faq` did.
- Left `isIndexWikiDocument` (nav-only) and the index-expansion search-candidate mechanism untouched — that's a different concern (search candidate discovery) from what gets displayed as a recommendation card.
- Left AI prompt-context construction (what background documents the AI reads to generate an answer) untouched — distinct from the visible recommend/related page list.

## Validation
See `test-result.md`. `pnpm -r typecheck`/`test` pass (317 tests), builds pass, and the fix was deployed to the live `ai-search` Lambda and confirmed against the exact originally-reported scenario (a question whose answer references the FAQ index page by name) — the index document itself no longer appears in the recommended/related lists.
