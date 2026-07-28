# guide-page-text-selection-ask Tasks

## Implementation
- [x] Task 1 — `PromptComposer`에 imperative `focus()` 노출 (`a5ee799`, code-quality 반영 `f3e3d3c`)
- [x] Task 2 — `ArticleAskPanel`에 imperative `fillAndFocus(text)` 노출 (`0924316`)
- [x] Task 3 — 신규 `ArticleSelectionAskButton` 컴포넌트 (`87f8054`, code-quality 반영 `3f8daa2`)
- [x] Task 4 — `ArticlePage`에 버튼 연결 (`3f1d561`)

## Test
- [x] `pnpm --filter @sfood/web typecheck`
- [x] `pnpm --filter @sfood/web test`
- [x] `pnpm --filter @sfood/web build`
- [x] Playwright: 실제 마우스 클릭으로 선택→버튼→클릭→Ask 인풋 채움/포커스 확인, 라이트/다크, 데스크톱/모바일, 컨테이너 바깥 선택 시 버튼 미노출, 내부 스크롤 컨테이너 dismiss 확인
- [x] Codex 크리티컬 리뷰 및 발견 사항 반영 (`52ccc2b`)

## Documentation
- [x] `test-result.md` 작성
- [x] `result.md` 작성
- [x] `docs/prd/implementation-status.md` 갱신
