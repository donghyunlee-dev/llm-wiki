# article-back-link-visibility Tasks

## Implementation Tasks
- [x] `.article-back-link`를 `.guide-detail-content` 안 in-flow로 이동, "목록으로" 텍스트 추가.
- [x] 불필요해진 `aria-label`/`title` 제거.
- [x] `styles.css`의 `.article-back-link`/`.guide-detail-shell` 스타일 정리.

## Test Tasks
- [x] `ArticlePage.test.tsx`에 신규 테스트 작성(RED 확인 후 GREEN).
- [x] `pnpm test`(전체) 통과 확인, 회귀 없음.
- [x] `pnpm typecheck`(전체) 통과 확인.
- [x] Playwright: 라이트/다크/모바일 시각 확인, 클릭 내비게이션 확인, 콘솔 에러 확인.

## Documentation Tasks
- [x] `test-result.md`/`result.md` 작성.
- [x] `docs/prd/implementation-status.md` 갱신.

## Progress Notes
- 2026-08-20: 사용자 확인 후 진행. TDD로 구현, Playwright 실측, Codex 리뷰 완료.
