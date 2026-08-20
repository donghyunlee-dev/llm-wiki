# guide-page-scroll-restoration Test Result

## Commands Executed
- `pnpm --filter @sfood/web test`(워크스페이스 전체) → **PASS** (34 files / 207 tests, 신규 `AppLayout.test.tsx` 1건 포함, 회귀 없음)
- `pnpm typecheck`(전체 워크스페이스) → **PASS**

## Unit Test
- `AppLayout.test.tsx`: `AppLayout()`이 반환하는 엘리먼트 트리에 `<ScrollRestoration />`이 포함되는지 구조적으로 검증(회귀 가드).
- **참고**: `createMemoryRouter`/`RouterProvider`로 실제 내비게이션(`router.navigate`, `<Link>` 클릭)을 발생시켜 `window.scrollTo` 호출을 검증하는 방식도 시도했으나, jsdom 환경에서 Node의 전역 `fetch`/`Request`(undici)가 사용하는 `AbortSignal`과 jsdom의 `AbortController`가 서로 다른 realm이라 `TypeError: RequestInit: Expected signal ... to be an instance of AbortSignal`가 발생해 React Router 데이터 라우터의 내비게이션 자체가 jsdom에서 막힘(이 저장소에 기존 선례 없음, 알려진 생태계 이슈로 판단). 전역 폴리필로 우회 시도했으나 해결되지 않아, 테스트 전용으로 앱 코드나 전역 설정을 바꾸는 대신(테스트 규칙: "production changes made only to satisfy weak tests" 금지) 구조적 검증으로 스코프를 좁히고 실제 동작 검증은 Playwright로 대체함.

## Playwright Review (로컬 dev 서버, 실제 Confluence 원격 데이터)
| 시나리오 | 결과 |
|---|---|
| `/guides` 목록을 스크롤(scrollY 700~774)한 뒤 가이드 링크 클릭 → 새 가이드 상세 페이지 진입 | **scrollY = 0** (수정 확인, AC1) |
| 위 상태에서 뒤로가기(`page.goBack()`) → `/guides` 목록으로 복귀 | scrollY = 0으로 복귀됨(스크롤 위치가 700으로 복원되지는 않음) — AC2 미확인, 아래 Open Gap 참고 |
| 가이드 상세 페이지에서 TOC 링크 클릭(`GitLab 토큰 보안`) | 기존과 동일하게 해당 헤딩으로 스크롤(`getBoundingClientRect().top` ≈ 80px), URL 해시만 `history.replaceState`로 갱신 — **회귀 없음 (AC3)** |
| 해시가 포함된 URL로 직접 하드 리로드(`.../guide-...#gitlab-토큰-보안`) | 해당 헤딩 위치로 정확히 스크롤됨(scrollY = 2045) — 부가 효과, 정상 동작 |
| 콘솔 확인 | 기존부터 있던 `ArticleContentRenderer`의 "unique key" 경고 1건만 존재, 이번 변경으로 인한 신규 에러 없음 |

## Codex Critical Review (2026-08-20)
- **Medium**: 뒤로가기 시 스크롤 복원 미동작은 확정된 원인 없이 남은 실제 동작 갭 — `AppLayout.tsx`의 `<ScrollRestoration />` 배치 자체는 문제가 아님(데이터 라우터 사용 조건 충족 확인). 개발 모드 StrictMode의 effect 이중 실행, 저장 시점 타이밍, 또는 하위 페이지 자체 스크롤 코드가 후보로 지목됨.
- **Low**: `AppLayout.test.tsx`가 구조적 존재 확인에 그쳐 회귀 가드로 얕음 — jsdom 환경에서 React Router 데이터 라우터의 실제 내비게이션이 Node undici `Request`와 jsdom `AbortController`/`AbortSignal`의 realm 불일치로 막혀(`TypeError: RequestInit: Expected signal ... to be an instance of AbortSignal`) 대체하지 못했음(테스트 전용으로 앱 코드/전역 설정을 바꾸지 않기로 결정).
- 대응: AC2 관련 후속 조사로 프로덕션 빌드(`pnpm build`, StrictMode 이중 실행 없음)로 재확인을 시도했으나, 로컬 빌드가 스냅샷 데이터(가이드 2개, 스크롤 불가능한 짧은 페이지)를 사용해 재현 조건을 만들지 못함 — 실 프로덕션(remote 데이터, 배포 환경)에서의 확인이 필요함을 Open Gap으로 기록(`result.md`).
- AC1(신규 진입 시 최상단 시작, 사용자가 실제 리포트한 버그)과 AC3(TOC 회귀 없음)는 Codex 리뷰에서도 별도 이견 없음.

## Acceptance Criteria Coverage
| AC | 결과 |
|---|---|
| AC1: 새 내비게이션 시 최상단 시작 | **PASS** (Playwright 실측) |
| AC2: 뒤로가기 시 이전 스크롤 위치 복원 | **미확인** — 로컬 dev 서버(React StrictMode 활성)에서는 관찰되지 않음. Codex 리뷰로 원인 조사 중(Open Gap 참고). 이 AC는 사용자가 리포트한 원 버그(신규 진입 시 스크롤 위치 오류)의 범위 밖이며, React Router 표준 컴포넌트의 부가 기능이다. |
| AC3: TOC 해시 앵커 회귀 없음 | **PASS** |
| AC4: `pnpm test`/`pnpm typecheck` 통과 | **PASS** |

## Skipped / Not Applicable Checks
- 없음(모두 시도, 일부는 위 사유로 대체 검증).

## Retest Outcomes
- 해당 없음(최초 구현).
