# Search Guide-Led Page Flow Plan

## Approach
1. Split search recommendations into a primary guide and secondary related documents.
2. Redesign the search answer surface to spotlight the primary guide and keep related pages as a separate grid.
3. Remove user-facing evidence quote rendering from the search result screen while preserving backend evidence for ranking and future debugging.
4. Improve article rendering for code and callout-like Confluence blocks.
5. Add bottom related-page sections on article pages using parent, prerequisite, next, and related metadata.

## Validation
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test -- src/ui/searchRecommendations.test.ts src/lib/aiSearchResponse.test.ts`
- `pnpm typecheck`
- `curl -s -X POST http://localhost:5173/api/wiki/ai/search -H 'Content-Type: application/json' -d '{"question":"윈도우에서 claude code cli 설치하는 방법"}'`
