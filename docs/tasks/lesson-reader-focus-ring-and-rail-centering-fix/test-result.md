# lesson-reader-focus-ring-and-rail-centering-fix Test Result

## Commands
- `pnpm --filter @sfood/web test -- --run LessonReaderPage` — Pass (24 tests)
- `pnpm test` (전체 워크스페이스) — Pass (154 tests)
- `pnpm typecheck` (전체 워크스페이스) — Pass

## Playwright Review — 실측 기반 검증 (1600×900)
- `getComputedStyle(title).outlineStyle === "none"` — 포커스 링 제거 확인.
- `content.left === innerWidth - content.right`(312px == 312px) — 좌우 여백 동일, 정중앙 복원 확인.
- 1차 수정(레일을 콘텐츠 하단에 `position: absolute`로 배치) 후 `rail.bottom`이 `dock.top`보다 커서(즉 레일이 dock 영역 안에 위치) 레일이 완전히 안 보이는 문제를 실측으로 발견 — 스크린샷에는 레일이 전혀 나타나지 않았으나 DOM 좌표는 정상이라 dock(z-30, 전체 폭, fixed)이 레일을 위에서 덮고 있었음을 확인.
- 2차 수정(`position: fixed` + dock 실측 높이 기반 `bottom` 오프셋) 후 `rail.bottom(554.5) < dock.top(578.5)` — 레일이 dock보다 항상 위에 뜸을 확인, 스크린샷으로도 정상 노출 확인.

## Acceptance Criteria Coverage
- AC1~AC4: 위 실측으로 모두 확인.

## Skipped Checks
- 없음.
