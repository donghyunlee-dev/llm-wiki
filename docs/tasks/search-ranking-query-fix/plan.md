# search-ranking-query-fix Plan

## Change

`vite.config.ts:384`

```typescript
// Before (bug)
const rankingRecommendedDocuments = getIndexFirstSearchWikiDocumentsIn(cache.documents, searchQuestion, 8)

// After (fix)
const rankingRecommendedDocuments = getIndexFirstSearchWikiDocumentsIn(cache.documents, searchQuery, 8)
```

`searchQuery`는 Stage 1 AI 키워드 join 결과. Stage 1 실패 시 `searchQuestion` fallback (line 307-309에서 이미 처리됨).

## Validation

1. `pnpm test` → 통과
2. `pnpm typecheck` → 통과
3. Playwright: 5173에서 "클로드 스킬과 코덱스 스킬의 차이점이 뒤지?" 검색 → 추천/관련 페이지에 Claude Code Skills 포함 확인
4. Codex 비판 리뷰
