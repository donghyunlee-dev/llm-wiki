# lesson-nav-fix-and-pretendard-font Plan

## Impacted Areas
- `packages/wiki-core/src/lib/lessonDocuments.ts` (+`.test.ts`) — `getPreviousLessonSlugFrom` 추가
- `apps/web/src/ui/pages/LessonReaderPage.tsx` (+`.test.tsx`) — `goPrevious()`, "이전" 버튼 `disabled` 조건
- `apps/web/package.json` — `pretendard` 의존성 추가
- `apps/web/src/styles.css` — 폰트 import, `--font-sans`/`--font-mono` 오버라이드, blockquote 모노스페이스

## Approach
- `getNextLessonSlugFrom`과 동일하게 `listLessonDocumentsFrom`으로 정렬된 배열에서 인덱스 -1을 반환하는 대칭 함수를 추가.
- `goPrevious()`에서 `isFirstScene`이면 이전 레슨 문서를 찾아 `compileLessonPresentationScenes`로 씬 개수를 구하고 마지막 인덱스로 이동(레슨 전환은 `navigate`, 같은 레슨 내 이동은 기존처럼 `setSceneIndex`).
- Pretendard는 가변 폰트 + 유니코드 서브셋 지연 로딩(`pretendardvariable-dynamic-subset.css`)을 사용해 초기 다운로드 크기를 최소화.
- 폰트 토큰은 디자인 시스템 패키지를 직접 수정하지 않고 앱의 `:root`에서 오버라이드(같은 커스텀 프로퍼티 이름 재선언 — CSS 캐스케이드로 나중 선언이 우선).

## Validation Plan
- `pnpm test` / `pnpm typecheck`
- `pnpm --filter @sfood/web build` (Pretendard `@import`가 빌드 산출물에 정상 포함되는지)
- Playwright: 레슨 2에서 "이전" 클릭 → 레슨 1 마지막 씬 이동 확인, 레슨 1에서 "이전" 비활성 확인, `document.fonts`로 Pretendard Variable 로드 확인
- Codex 비판 리뷰

## Risks
- npm 패키지가 등록하는 실제 폰트 패밀리명이 "Pretendard Variable"이라 사용자가 요청한 정확한 문자열 "Pretendard"와 다름 — Codex 리뷰로 실질적 문제 여부 확인.
