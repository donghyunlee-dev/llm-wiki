# lesson-index-main-screen-redesign Result

## Delivered Scope
`/lesson`을 "교육 콘텐츠 메인 화면"에 맞는 디자인으로 재구성하고, "완료" 삭제와 일관되지 않게 남아있던 "이어서 학습하기" 진행 상태 기능을 함께 제거했다.

- 히어로 영역: eyebrow 뱃지 + 큰 헤드라인 + 통계 chip 3개 + CTA.
- 레슨 리스트: 챕터 그룹 헤더 + 구분선 기반 행(블로그 리스트 스타일), 카드 박스 스타일 제거.
- "이어서 학습하기"/`lessonProgress.ts`(localStorage 진행 상태) 전체 삭제 — 시작 버튼은 항상 `lessons[0]`.

## Changed Files
- `apps/web/src/ui/pages/LessonIndexPage.tsx` / `.test.tsx` — 전면 재작성
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — `markSceneVisited` 호출/import 제거
- `apps/web/src/data/lessonAnalytics.ts` — `progress_recovered` 이벤트 타입 제거
- `apps/web/src/data/lessonProgress.ts`, `.test.ts` — 삭제
- `apps/web/src/styles.css` — `.lesson-index-*` 전면 교체

## Key Decisions
- **"이어서 학습하기" 완전 삭제** — 사용자가 "완료 삭제와의 일관성" 문제를 제기했고, AskUserQuestion으로 확인 후 기반 모듈까지 통째로 제거(표시만 감추는 대신 저장 로직도 정리).
- **다른 페이지와 동일한 스타일을 강제하지 않고 디자인 시스템 토큰만 재사용** — `--radius-xl`/`--accent-soft`/`--card-bg`/`--panel-border-soft` 등 기존 토큰으로 새 시각 구조(히어로+블로그 리스트)를 구성.
- **리스트를 챕터 그룹 + 구분선 방식으로 전환** — 사용자가 긍정적으로 평가했던 "학습 흐름" 드로어의 그룹핑 아이디어를 메인 화면에도 적용.

## Open Gaps
- 없음.

## Next Steps
- 없음.
