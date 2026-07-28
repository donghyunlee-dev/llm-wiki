# guide-page-text-selection-ask Plan

## Summary
`PromptComposer`와 `ArticleAskPanel`을 `forwardRef`로 전환해 각각 `focus()`/`fillAndFocus(text)` imperative handle을 노출한다. 신규 컴포넌트 `ArticleSelectionAskButton`이 `selectionchange`/`scroll`/`mousedown`/`keydown`을 감지해 플로팅 버튼을 렌더링하고, 클릭 시 `onAsk(text)` 콜백만 호출한다. `ArticlePage`가 두 컴포넌트를 ref/콜백으로 연결하는 유일한 지점이며, `ArticleContentRenderer`(본문 HTML 렌더링)는 이 기능을 전혀 모른다.

## Impacted Modules
- `apps/web/src/ui/PromptComposer.tsx`, `apps/web/src/ui/PromptComposer.test.ts`
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`, `apps/web/src/ui/pages/ArticleAskPanel.test.tsx`
- `apps/web/src/ui/pages/ArticleSelectionAskButton.tsx`(신규), `apps/web/src/ui/pages/ArticleSelectionAskButton.test.tsx`(신규)
- `apps/web/src/ui/pages/ArticlePage.tsx`
- `apps/web/src/styles.css`(`.article-selection-ask-button`)

## Architecture Approach
- 순수 React 컴포넌트 계층으로 처리 — 전역 이벤트 버스나 컨텍스트 없이, `ArticlePage`가 소유한 두 개의 ref(`articleRef`, `askPanelRef`)로만 컴포넌트 간 결합.
- `useImperativeHandle`의 의존성 배열은 빈 배열(`[]`)로 고정 — 클로저가 참조하는 값(ref, 안정적인 state setter)이 모두 안정적이라 재생성이 불필요(code-quality 리뷰에서 확정).
- CSS는 `@sfood/ui` 기존 토큰(`--accent`, `--radius-md` 등)만 재사용, 신규 하드코딩 없음.

## Data And API Impact
- 없음. 순수 프레젠테이션/인터랙션 레이어 변경이며 데이터/스키마/API 계약에 영향 없음.

## Validation Plan
- `pnpm --filter @sfood/web typecheck`/`test`/`build`
- Playwright MCP: 실제 브라우저 마우스 클릭(합성 이벤트가 아닌 `page.locator().click()`)으로 선택→버튼→클릭→Ask 인풋 채움/포커스 확인. 라이트/다크, 데스크톱(1280px)/모바일(390px), 컨테이너 바깥 선택 시 버튼 미노출 확인.
- Codex 크리티컬 리뷰: 전체 diff(Task 1-4) 대상으로 1회 수행.

## Risks
- 브라우저가 버튼 클릭 시 mousedown에서 선택을 collapse시켜 클릭이 유실될 수 있음 — Codex 리뷰에서 실제로 발견, `onMouseDown`에 `preventDefault()` 추가로 해결.
- 코드블록/표 등 내부 스크롤 컨테이너 스크롤 시 버튼이 stale 좌표에 남을 수 있음 — Codex 리뷰에서 실제로 발견, `window` 스크롤 리스너를 `document` 캡처 단계 리스너로 교체해 해결.

## Rollback Considerations
- 각 태스크가 독립된 커밋으로 나뉘어 있어(`a5ee799`, `f3e3d3c`, `0924316`, `87f8054`, `3f8daa2`, `3f1d561`, `52ccc2b`), 문제 발생 시 관련 커밋만 `git revert`하면 이전 상태로 되돌릴 수 있다.
