# guide-page-scroll-restoration Plan

## Summary
- `AppLayout.tsx`에 `react-router-dom`의 `<ScrollRestoration />`을 한 줄 추가.

## Impacted Modules
- `apps/web/src/ui/AppLayout.tsx`
- `apps/web/src/ui/AppLayout.test.tsx` (신규 또는 확장 — jsdom에서 실제 스크롤 복원 동작 자체는 검증이 어려우므로, `<ScrollRestoration />`이 렌더 트리에 포함되는지만 회귀 테스트로 고정)

## Architecture Approach
- React Router 표준 컴포넌트를 그대로 사용 — 커스텀 스크롤 로직을 직접 구현하지 않는다(Data Router API가 이미 이 문제를 해결하기 위해 제공하는 컴포넌트).
- `ArticlePage`의 기존 해시 앵커 스크롤 로직(`handleTocClick`)은 건드리지 않는다.

## Validation Plan
- `pnpm test`/`pnpm typecheck`.
- Playwright: 로컬 dev 서버에서 (1) 홈 화면을 스크롤한 뒤 가이드 링크 클릭 → 새 페이지가 최상단인지 `window.scrollY` 실측, (2) 가이드 상세 페이지에서 뒤로가기 → 이전 스크롤 위치 복원 확인, (3) TOC 링크 클릭 → 기존과 동일하게 해당 헤딩으로 이동하는지 확인(회귀 없음).

## Risks
- `<ScrollRestoration />`은 요청에 해시(`#...`)가 있으면 해시 대상으로 스크롤을 시도하는데, TOC 클릭은 이미 자체 `scrollIntoView` + `history.replaceState`로 해시를 세팅한다 — 둘이 충돌해 두 번 스크롤되거나 위치가 어긋날 가능성을 Playwright로 확인해야 한다.

## Rollback Considerations
- 한 줄 제거로 즉시 원복 가능.
