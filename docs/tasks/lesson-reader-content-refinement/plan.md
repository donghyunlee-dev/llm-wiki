# lesson-reader-content-refinement Plan

## Impacted Areas
- `apps/web/src/ui/pages/LessonIndexPage.tsx` (+`.test.tsx`) — 가로형 리스트, 설명 생성/폴백/트렁케이션
- `apps/web/src/ui/pages/LessonReaderPage.tsx` (+`.test.tsx`) — 완료 표시 제거, 교육 설명 기본 노출, 배너 위치, 카운터 이동
- `apps/web/src/data/lessonProgress.ts` (+`.test.ts`) — `completedLessonSlugs`/`markLessonCompleted` 삭제
- `packages/wiki-core/src/lib/lessonPresentation.ts` (+`.test.ts`) — narration 문장 분리
- `apps/web/src/styles.css` — 목록/리더/드로어 스타일 전면 조정

## Approach
- 목록 카드 설명: `compileLessonPresentationScenes`로 첫 씬 컴파일 → `hookStatement`/`paragraph` 블록 텍스트 결합 → 없으면 `lesson.summary` 폴백 → 100자 트렁케이션.
- 완료 삭제: `lessonProgress.ts`에서 필드/함수 제거 → 호출부(`LessonReaderPage.tsx`, `LessonIndexPage.tsx`) 정리 → 관련 테스트 갱신.
- narration 분리: 정규식 대신 문자 단위 스캔으로 소수점 예외 처리(`splitIntoSentences`).
- 배너: `position: fixed`로 우측 하단 고정, 하단 바보다 높은 z-index + safe-area 고려 `bottom` 계산.
- 카운터: 상단바에서 제거 → 하단 `.lesson-reader-controls`에 이전/다음 버튼 사이로 이동.
- 학습 흐름: 패널 패딩/리스트 gap/버튼 padding 축소.

## Validation Plan
- `pnpm test` / `pnpm typecheck` (wiki-core + web)
- Playwright: `/lesson` 목록, 레슨 리더(일반 씬 + 마지막 씬), 학습 흐름 드로어 — 라이트/다크 테마
- Codex 비판 리뷰 → 발견된 이슈(문장 분리 정규식의 소수점 유실, 목록 설명 빈 값 폴백 부재, 배너 z-index) 수정 반영

## Risks
- narration 문장 분리가 실제 콘텐츠의 모든 구두점 패턴을 완벽히 커버하지 못할 수 있음(예: 인용부호, 줄임표) — 발견되면 추가 케이스로 보강.
- `transitionToNext` 배너가 `position: fixed`라 스크롤 시 본문 위에 계속 떠 있음 — 짧은 텍스트 폭(`max-w-xs`)으로 완화.
