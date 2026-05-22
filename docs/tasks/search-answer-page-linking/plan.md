# Search Answer Page Linking Plan

## Approach
1. Extend the search AI response contract so actionable items can carry related page ids.
2. Normalize the richer response shape in the web parser so malformed mixed output still recovers page linkage.
3. Render item-level page links and answer evidence directly in the search result UI.
4. Keep recommendation fallback behavior so the UI still links to something useful when the model omits related ids.

## Validation
- `pnpm --filter @sfood/web typecheck`
- `pnpm --filter @sfood/web test -- src/lib/aiSearchResponse.test.ts src/ui/searchRecommendations.test.ts`
- `curl -s -X POST http://localhost:5173/api/wiki/ai/search -H 'Content-Type: application/json' -d '{"question":"윈도우에서 claude code cli 설치하는 방법"}'`
