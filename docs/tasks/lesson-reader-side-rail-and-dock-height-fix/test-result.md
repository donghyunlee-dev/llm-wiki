# lesson-reader-side-rail-and-dock-height-fix Test Result

## Commands
- `pnpm --filter @sfood/web test -- --run LessonReaderPage` — Pass (24 tests)
- `pnpm test` (전체 워크스페이스) — Pass (154 tests)
- `pnpm typecheck` (전체 워크스페이스) — Pass

## Systematic Debugging: "교육 설명 숨기기가 안 된다"
- **Phase 1 재현 시도**: Playwright 실제 브라우저 클릭으로 숨기기/보이기 토글, jsdom 컴포넌트 테스트 모두 정상 동작 확인 — 재현 실패.
- **결론**: 이번 세션 이전에 `transitionToNext` 배너가 `position: fixed`로 독립 배치돼 있던 시점에는 패널이 펼쳐진 상태에서 배너가 숨기기 버튼 위에 시각적으로 겹칠 수 있었음(z-index상 배너가 위) — 그 상태였다면 실제 클릭이 버튼에 도달하지 못했을 수 있음. 이후 배너를 dock 구조 안으로 옮기면서 이 겹침 자체가 구조적으로 제거됨. jsdom 컴포넌트 테스트는 요소를 참조로 직접 클릭해 실제 히트테스트를 하지 않으므로 이 클래스의 버그는 원천적으로 못 잡는다는 점을 사용자에게 설명함.
- **부수 발견(진짜 버그)**: 위 재현 시도 중 사이드 레일 작업을 검증하다가, `ResizeObserver`가 dock 높이를 한 번도 실측하지 못하고 있었음을 `getComputedStyle`로 직접 확인 — `useEffect(..., [])`가 로딩 스피너 렌더 시점(dock ref가 null)에 한 번 실행되고 다시 재시도되지 않는 타이밍 버그. deps 제거로 근본 수정, 실측으로 CSS 변수가 실제 dock 높이와 일치함을 재확인.

## Playwright Review (6b)
- 1366×768(작은 노트북): 카드 그리드가 있는 씬에서 수정 전 `scrollHeight === innerHeight`(스크롤 자체가 없어 가려진 카드 2장을 영구히 볼 수 없었음) → 수정 후 `scrollHeight(862) > innerHeight(768)`, 스크롤하면 카드 4장 전부 dock 위로 완전히 드러남을 실측.
- xl(1280px) 이상: "다음: ..." 안내가 우측 사이드 레일에 표시되고, 하단 dock 쪽 사본은 CSS로 숨겨짐(DOM에는 둘 다 존재, jsdom 테스트에서는 두 개 다 렌더됨을 확인).
- 1440×900 데스크톱: 사이드 레일/패널/레이아웃 전반 회귀 없음 확인.

## Codex Critical Review
- 이번 라운드는 Codex 호출 없이 직접 실측(Playwright `getComputedStyle`/`getBoundingClientRect`)으로 근본 원인을 추적하고 수정, 재검증까지 완료.

## Acceptance Criteria Coverage
- AC1~AC5: 테스트 + Playwright 실측으로 확인.

## Skipped Checks
- `ResizeObserver` 타이밍 버그에 대한 자동화 회귀 테스트는 추가하지 않음(jsdom에 `ResizeObserver`가 없어 폴리필 없이는 검증 불가) — Playwright 실측 증거로 대체.
