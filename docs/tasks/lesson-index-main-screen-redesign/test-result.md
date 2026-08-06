# lesson-index-main-screen-redesign Test Result

## Commands
- `pnpm --filter @sfood/web test -- --run LessonIndexPage` — Pass (24 files / 153 tests)
- `pnpm test` (전체 워크스페이스) — Pass
- `pnpm typecheck` (전체 워크스페이스) — Pass

## Playwright Review (6b)
remote 모드 dev 서버(실 Confluence 데이터)에서 라이트/다크 테마로 확인:
- `/lesson`: 히어로 카드(뱃지 "AI 기초교육" + 헤드라인 + 3개 통계 칩 + "학습 시작하기" CTA), 그 아래 챕터 헤더("AI 이해의 시작", "도구와 모델 선택" 등)로 그룹핑된 23개 레슨이 구분선 리스트로 표시됨.
- 레슨 리더 화면 진입 확인 — `markSceneVisited` 제거로 인한 런타임 에러 없음, 콘솔 에러 없음.

## Codex Critical Review (6c)
`mcp__codex__codex`로 진행 상태 삭제 완전성, 챕터 그룹핑 안전성, 인덱스 정합성, CSS 죽은 클래스 여부를 리뷰 요청.
- 코드베이스 전체(`apps/web/src`, `packages`)에 `lessonProgress`/`markSceneVisited`/`LESSON_COURSE_ID`/`progress_recovered`/"이어서 학습하기" 참조 없음 확인.
- `outline.lessons[index]`와 `lessons[index]`가 둘 다 `listLessonDocumentsFrom` 기반이라 인덱스 정합성이 보장됨을 확인.
- 챕터 헤더 조건이 `undefined` 챕터끼리는 헤더를 렌더링하지 않아 안전함을 확인.
- 빈 목록/레슨 1개 엣지 케이스 가드 확인.
- CSS에 죽은 `.lesson-index-*` 클래스 없음 확인.
- 문서(PRD)에만 과거 참조가 남는 것은 정상(이번 라운드 `implementation-status.md`에서 갱신).
- 결함 없음으로 결론, 추가 수정 없음.

## Acceptance Criteria Coverage
- AC1~AC4: 테스트 + Playwright + Codex 리뷰로 확인.

## Skipped Checks
- 없음.
