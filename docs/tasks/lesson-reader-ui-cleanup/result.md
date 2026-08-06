# lesson-reader-ui-cleanup Result

## Delivered Scope
참고 사이트 대비 분석 리포트를 본 사용자 피드백 3건을 반영해 레슨 리더 UI를 정리했다.
- 상단 이중 카운터("이 레슨 X/Y · 전체 X/Y")를 참고 사이트처럼 단일 카운터로 통일.
- "이전" 버튼이 배경과 같은 색이라 안 보이던 문제를 배경 대비를 줘서 수정.
- "학습 흐름" 드로어에서 레슨 제목과 씬 제목이 중복 표시되던 것과 "약 N분" 표시를 제거하고, 챕터 헤더 아래 타이틀만 있는 리스트로 단순화.

## Changed Files
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — 상단 카운터 분기(`globalPosition` 있으면 전체만, 없으면 이 레슨만)
- `apps/web/src/ui/pages/LessonReaderPage.test.tsx` — 카운터 테스트 갱신(단일 아이템 개수 검증 추가)
- `apps/web/src/ui/pages/LessonOutlineDrawer.tsx` — 레슨 제목/시간 줄 제거
- `apps/web/src/ui/pages/LessonOutlineDrawer.test.tsx` — 제목/시간 부재 검증 테스트 추가
- `apps/web/src/styles.css` — `.lesson-reader-nav-button` 배경 대비 조정, 이제 안 쓰는 `.lesson-reader-progress-label`/`.lesson-outline-lesson-title`/`.lesson-outline-lesson-minutes` 삭제

## Key Decisions
- **단일 카운터에 "이 레슨"/"전체" 레이블을 붙이지 않고 순수 숫자만 표시** — 참고 사이트의 "01/23" 스타일 단순 카운터를 목표로 한 수정이라는 점을 Codex 리뷰 지적에 대한 답으로 명확히 함(레이블을 다시 붙이면 원래 목표였던 단순함이 훼손됨).
- **레슨 제목 줄 완전 제거, 씬 버튼만 남김** — 현재 실 콘텐츠는 레슨:씬이 항상 1:1이라 안전. 다중 씬 레슨이 생기면 레슨 경계 없이 씬들이 챕터 아래 나열되고 씬 번호가 레슨마다 1부터 리셋되는 점은 사용자 확인 후 허용된 트레이드오프(`spec.md` 참고).

## Open Gaps
- 다중 씬 레슨이 실제로 도입되면 학습 흐름 드로어에 레슨 경계 표시나 전역 씬 번호가 필요할 수 있음(현재는 불필요, 콘텐츠 구조 변경 시 재검토).
- `/lesson` 코스 카드 요약 텍스트 중복 버그는 이번 스코프에 포함되지 않음(별도 태스크 필요, 비교 분석 리포트에서 이미 보고됨).

## Next Steps
- 없음(요청된 3건 모두 완료).
