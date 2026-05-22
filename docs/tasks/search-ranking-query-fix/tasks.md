# search-ranking-query-fix Tasks

## Implementation

- [x] `vite.config.ts:384` `searchQuestion` → `searchQuery` 수정
- [x] `vite.config.ts:307-309` searchKeywords trim/filter 추가 (Codex Medium 지적)

## Validation

- [x] `pnpm test` 전체 통과
- [x] `pnpm typecheck` 통과
- [x] Playwright: 추천/관련 페이지에 Claude Code Skills 포함 확인
- [x] Codex 비판 리뷰
- [x] `test-result.md` 작성
- [x] `result.md` 작성
- [x] `implementation-status.md` 업데이트
