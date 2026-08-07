# lesson-nav-fix-and-pretendard-font Test Result

## Commands
- `pnpm --filter @sfood/wiki-core test -- --run lessonDocuments` — Pass (13 tests)
- `pnpm --filter @sfood/web test -- --run LessonReaderPage` — Pass (25 tests)
- `pnpm test` (전체 워크스페이스) — Pass
- `pnpm typecheck` (전체 워크스페이스) — Pass
- `pnpm --filter @sfood/web build` — Pass, `dist/assets/PretendardVariable.subset.*.woff2` 생성 확인
- `pnpm install --frozen-lockfile` — Pass (lockfile drift 되돌린 뒤 정합성 확인)

## Playwright Review (6b)
remote 모드 dev 서버에서 확인:
- 레슨 2(scene=0)에서 "이전" 클릭 → 레슨 1(`ai-first-perspective`)의 마지막(유일한) 씬으로 이동, `data-direction="backward"` 확인(실제 클릭 이벤트 기준 — `browser_evaluate` 내 동기 `.click()` 호출은 React 배치 타이밍과 경합해 오탐이 있었음, 실제 Playwright 클릭으로 재확인).
- 레슨 1(첫 레슨) 첫 씬에서 "이전" 버튼 비활성 상태 확인.
- `document.fonts`로 "Pretendard Variable" 로드 확인, `getComputedStyle(document.body).fontFamily`가 요청한 폴백 순서와 일치함을 확인.

## Codex Critical Review (6c)
`mcp__codex__codex`로 `goPrevious()` 로직, `getPreviousLessonSlugFrom`의 unordered-lesson 처리, Pretendard `@import`/빌드 산출물, 폰트 토큰 오버라이드, "Pretendard Variable" 네이밍을 리뷰 요청. 3건 확인:
1. **Confirmed — 수정함**: 레슨 경계를 넘어 이전 레슨으로 이동할 때 `beginTransition("backward")`를 호출하지 않아 진입 애니메이션 방향이 `direction` 상태의 이전 값(기본 `"forward"`)에 의존하던 문제. `navigate()` 호출 직전에 `beginTransition("backward")` 추가, `data-direction` 회귀 테스트 추가.
2. **Confirmed, 범위 밖으로 문서화**: `listLessonDocumentsFrom`이 `courseId`/`order`가 없는(unordered) 레슨을 모든 정렬된 코스 뒤에 이어붙이는 기존 설계상, `getPreviousLessonSlugFrom`/`getNextLessonSlugFrom` 둘 다 마지막 정렬 레슨과 첫 unordered 레슨을 인접한 것처럼 연결할 수 있음. 이 특성은 `getNextLessonSlugFrom`(기존 코드)에도 이미 존재하던 것으로, 이번 태스크에서 대칭 함수를 추가하며 그대로 상속됨. 실 콘텐츠(23개 레슨 모두 courseId/order 보유)에는 영향 없어 이번 스코프에서 재설계하지 않고 Open Gap으로 기록.
3. **Confirmed — 수정함**: `pnpm add pretendard` 실행 중 `@sfood/ui`(git `#main` 의존성)가 최신 커밋으로 자동 재해석되어 폰트 작업과 무관한 lockfile drift가 발생. `pnpm-lock.yaml`의 커밋 해시를 원래 값으로 되돌리고 `pnpm install --frozen-lockfile`로 정합성 재확인.
- "Pretendard Variable" 네이밍은 실수가 아님을 확인(npm 패키지가 실제로 그 이름으로 `@font-face`를 등록하므로 "Pretendard"만 쓰면 매칭 안 됨). 다크 테마 토큰 재정의도 `--font-sans`/`--font-mono`를 다시 덮지 않음을 확인.

## Acceptance Criteria Coverage
- AC1~AC4: 테스트 + Playwright + Codex 리뷰로 확인.

## Skipped Checks
- 없음.
