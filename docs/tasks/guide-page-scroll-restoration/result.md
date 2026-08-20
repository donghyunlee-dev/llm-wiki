# guide-page-scroll-restoration Result

## Delivered Scope
- 사용자가 리포트한 버그(스크롤을 내린 상태에서 가이드 페이지로 이동하면 최상단이 아니라 중간에서 시작) 수정: `AppLayout.tsx`에 `react-router-dom`의 `<ScrollRestoration />` 추가.
- 원인: `createBrowserRouter` 데이터 라우터를 쓰면서도 이 컴포넌트가 빠져 있어, client-side 내비게이션 시 브라우저가 이전 스크롤 위치를 그대로 유지하고 있었음.
- 이 레이아웃을 공유하는 모든 라우트(홈/가이드/문서/FAQ/라이브러리/프로젝트 등)에 동일하게 적용됨.

## Changed Files
- `apps/web/src/ui/AppLayout.tsx`
- `apps/web/src/ui/AppLayout.test.tsx` (신규)
- `docs/tasks/guide-page-scroll-restoration/*`
- `docs/prd/implementation-status.md`

## Key Decisions
- React Router 표준 컴포넌트를 그대로 사용 — 커스텀 스크롤 리셋 로직을 직접 구현하지 않음.
- `ArticlePage`의 기존 TOC 해시 앵커 스크롤(`handleTocClick`, `history.replaceState`)은 건드리지 않음 — Playwright로 회귀 없음 확인.
- 단위 테스트는 구조적 검증(`<ScrollRestoration />`이 렌더 트리에 포함되는지)으로 스코프를 좁힘 — jsdom 환경에서 React Router 데이터 라우터의 실제 내비게이션이 Node/jsdom 간 `AbortSignal` realm 불일치로 동작하지 않는 생태계 이슈를 확인했고, 이를 우회하기 위해 앱 코드나 전역 테스트 설정을 바꾸는 대신(테스트 규칙 위반) 실제 동작 검증은 Playwright로 수행함.

## Validation
- `pnpm test`(34 files/207 tests, 신규 1건 포함, 회귀 없음), `pnpm typecheck` 모두 통과.
- Playwright로 로컬 dev 서버(실제 Confluence 원격 데이터)에서 검증:
  - 스크롤 후 새 가이드 페이지 진입 → 최상단(scrollY=0) 확인(**원 버그 수정 확인**).
  - TOC 클릭 → 기존과 동일하게 해당 헤딩으로 스크롤(회귀 없음).
  - 해시 포함 URL 직접 진입 → 해당 헤딩으로 스크롤(부가 효과, 정상).
  - 콘솔에 신규 에러 없음(기존 `ArticleContentRenderer` key 경고만 존재, 무관).
- Codex 크리티컬 리뷰 완료 — Medium 1건(뒤로가기 복원 미확정), Low 1건(테스트가 얕음) 지적, 두 건 모두 아래 Open Gap으로 기록(코드 배치·품질 자체에는 이견 없음).

## Open Gaps
- **뒤로가기(popstate) 시 스크롤 위치 복원이 로컬 dev 서버(React StrictMode 활성)에서 관찰되지 않음.** 사용자가 리포트한 원 버그(신규 진입 시 스크롤 위치)와는 무관한 React Router 표준 컴포넌트의 부가 기능이라 이번 수정으로 인한 회귀는 아니지만(수정 전에도 복원 기능 자체가 없었음), 기대되는 동작은 아니다. StrictMode의 개발 전용 effect 이중 실행이 원인일 가능성을 프로덕션 빌드로 재확인하려 했으나, 로컬 빌드가 스냅샷 데이터(콘텐츠 2건, 스크롤 불가능한 짧은 페이지)를 써서 재현 조건을 만들지 못했다 — **실제 배포 환경(ax-wiki.s-food.ai)에서 재확인이 필요**하다.
- `AppLayout.test.tsx`는 `<ScrollRestoration />`의 존재만 구조적으로 검증하는 얕은 회귀 가드다. jsdom + React Router 데이터 라우터의 실제 내비게이션 테스트는 Node undici `Request`와 jsdom `AbortController`의 realm 불일치로 이 저장소의 테스트 환경에서는 막혀 있다 — 더 강한 회귀 가드가 필요하면 vitest 환경을 happy-dom으로 바꾸거나 별도 폴리필 전략이 필요하며, 이는 전체 테스트 스위트에 영향을 주는 더 큰 변경이라 이번 스코프 밖으로 남긴다.

## Next Steps
- 배포 후 프로덕션에서 뒤로가기 스크롤 복원 여부를 재확인(필요하면 후속 이슈로 등록).
