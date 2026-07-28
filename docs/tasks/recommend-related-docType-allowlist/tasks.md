# recommend-related-docType-allowlist Tasks

- [x] Change `aiOrchestration.ts`'s `rankingRecommendedDocuments`/`aiRecommendedDocuments` filters to guide/page allowlist
- [x] Change `ArticleAskPanel.tsx`'s `suggestedNextPages` render filter to guide/page allowlist (+ remove now-dead unlinked-card branch)
- [x] Change `searchRecommendations.ts`'s `buildFallbackRecommendedDocuments` to guide/page allowlist
- [x] Update `search-flow-contract.md`
- [x] Add regression tests (searchRecommendations, ArticleAskPanel)
- [x] `pnpm test`/`typecheck`/`build` pass
- [x] Deploy to live `ai-search` Lambda and verify the FAQ index page no longer leaks
- [x] Write test-result.md, result.md
