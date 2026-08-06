# lesson-index-main-screen-redesign Plan

## Impacted Areas
- `apps/web/src/ui/pages/LessonIndexPage.tsx` (+`.test.tsx`) — 전면 재작성
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — `markSceneVisited` 호출 제거
- `apps/web/src/data/lessonAnalytics.ts` — `progress_recovered` 이벤트 제거
- `apps/web/src/data/lessonProgress.ts` / `.test.ts` — 삭제
- `apps/web/src/styles.css` — `.lesson-index-*` 전면 교체

## Approach
- 진행 상태 삭제: `lessonProgress.ts` 모듈 삭제 → `LessonReaderPage.tsx`/`LessonIndexPage.tsx`의 호출부·import 제거 → `lessonAnalytics.ts`의 `progress_recovered` 타입 제거.
- 히어로: 기존 `--radius-xl`/`--accent-soft`/`--card-bg` 등 디자인 토큰만 사용해 뱃지+헤드라인+칩+CTA 구조로 구성.
- 리스트: `LessonOutlineDrawer`의 챕터 그룹핑 방식(이전 항목과 챕터가 다를 때만 헤더 렌더링)을 동일하게 적용, 카드 박스 대신 구분선(`border-b`) 기반 행으로 전환.

## Validation Plan
- `pnpm test` / `pnpm typecheck`
- Playwright: `/lesson` 라이트/다크 테마, 레슨 리더 진입 확인(참조 삭제로 인한 회귀 없는지)
- Codex 비판 리뷰

## Risks
- `outline.lessons[index]`와 `lessons[index]` 인덱스 정합성이 깨지면 챕터/설명이 잘못 매칭될 수 있음 — Codex 리뷰로 두 배열이 동일 소스(`listLessonDocumentsFrom`) 기반임을 확인.
