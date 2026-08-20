# guide-page-scroll-restoration Tasks

## Implementation Tasks
- [x] `AppLayout.tsx`에 `<ScrollRestoration />` 추가.

## Test Tasks
- [x] `AppLayout.test.tsx` 작성(RED 확인 후 GREEN) — `<ScrollRestoration />` 존재 여부 구조적 검증.
- [x] `pnpm test`(전체) 통과 확인, 회귀 없음.
- [x] `pnpm typecheck`(전체) 통과 확인.
- [x] Playwright: 스크롤 후 새 가이드 페이지 진입 시 최상단 시작 확인.
- [x] Playwright: TOC 클릭 회귀 없음 확인.
- [x] Playwright: 해시 포함 URL 직접 진입 시 정상 동작 확인.
- [x] Playwright: 뒤로가기 스크롤 복원 확인 시도 — dev 서버에서 미확인(Open Gap).
- [x] 프로덕션 빌드로 StrictMode 가설 재확인 시도 — 스냅샷 데이터 한계로 재현 실패(Open Gap 유지).

## Documentation Tasks
- [x] `test-result.md`에 실행 커맨드·Playwright 결과·Codex 리뷰 기록.
- [x] `result.md`에 구현 요약 및 Open Gap 기록.
- [x] `docs/prd/implementation-status.md` 갱신.

## Progress Notes
- 2026-08-20: spec.md/plan.md 작성, TDD로 구현 및 검증, Codex 리뷰 완료.
