# guide-page-scroll-restoration Spec

## Problem Statement
- 사용자가 스크롤을 내린 상태에서 가이드 페이지(및 그 외 모든 라우트)로 client-side 이동하면, 새 페이지가 최상단이 아니라 이전 페이지의 스크롤 위치만큼 아래(중간)에서 시작한다.
- 원인: `apps/web/src/router.tsx`가 `createBrowserRouter`를 쓰지만, 공통 레이아웃(`AppLayout.tsx`)에 React Router의 `<ScrollRestoration />`이 없다. 이 컴포넌트가 없으면 라우터는 내비게이션 시 스크롤 위치를 관리하지 않고, 브라우저가 이전 `scrollY`를 그대로 유지한다.

## Scope
- `AppLayout.tsx`에 `<ScrollRestoration />`을 추가해, 새 내비게이션 시 최상단으로 스크롤하고 뒤로/앞으로가기 시 원래 위치를 복원하는 React Router 표준 동작을 켠다.

## Out Of Scope
- `#heading-id` 해시 앵커로의 이동(`ArticlePage`의 TOC 클릭, `handleTocClick`)은 이미 자체적으로 `scrollIntoView`를 호출하므로 이번 변경 대상이 아니다 — `ScrollRestoration`은 해시가 없는 일반 내비게이션에만 영향을 준다는 점을 확인해야 한다(React Router 동작 특성).
- 레슨 리더(`/lesson/:slug`)처럼 자체 dock/고정 레이아웃을 쓰는 화면의 스크롤 동작은 이번 변경과 무관(`ScrollRestoration`은 `AppLayout`의 `Outlet` 바깥 스크롤에만 영향).

## User Or Operator Scenarios
- 홈 또는 `/guides` 목록을 스크롤한 상태에서 가이드 링크를 클릭하면, 새 가이드 상세 페이지가 최상단에서 시작한다.
- 가이드 상세 페이지에서 뒤로가기를 누르면, 이전에 보고 있던 목록의 스크롤 위치로 복원된다.
- TOC(목차) 링크를 클릭해 문서 내 특정 헤딩으로 이동하는 기존 동작은 변경되지 않는다.

## Acceptance Criteria
- AC1: 스크롤을 내린 상태에서 다른 라우트로 이동하면 새 페이지는 최상단(`scrollY` ≈ 0)에서 시작한다.
- AC2: 뒤로가기(popstate) 시 이전 스크롤 위치가 복원된다.
- AC3: TOC 해시 앵커 이동은 기존과 동일하게 해당 헤딩으로 스크롤된다(회귀 없음).
- AC4: `pnpm test`, `pnpm typecheck` 통과.

## Assumptions
- `<ScrollRestoration />`은 `RouterProvider`가 렌더링하는 라우터 트리 안(레이아웃 라우트 엘리먼트 내부)에 위치해야 정상 동작한다 — `AppLayout.tsx`의 `<Outlet />` 옆에 배치한다.
