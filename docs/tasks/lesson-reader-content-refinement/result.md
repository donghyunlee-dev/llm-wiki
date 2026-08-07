# lesson-reader-content-refinement Result

## Delivered Scope
사용자가 서비스를 직접 확인한 뒤 남긴 10개 피드백을 정리·확인받아 모두 반영했다.

1. `/lesson` 가로형 1열 리스트, 설명 100자 제한(+제목 중복 버그 해결), 시간 표시 제거.
2. "완료" 관련 기능(뱃지/라벨/저장 로직) 전체 삭제.
3. "대본" → "교육 설명" 개명, 기본 노출 + 우측 숨기기 버튼.
4. narration을 문장 단위 여러 문단으로 분리 렌더링.
5. `transitionToNext` 안내를 우측 하단 고정 카드로 변경.
6. 진행률 카운터를 하단 풋터로 이동.
7. 씬 타이틀 폰트 축소, 세로 간격 확대.
8. 학습 흐름 드로어 간격 축소.

## Changed Files
- `apps/web/src/ui/pages/LessonIndexPage.tsx` / `.test.tsx`
- `apps/web/src/ui/pages/LessonReaderPage.tsx` / `.test.tsx`
- `apps/web/src/data/lessonProgress.ts` / `.test.ts`
- `packages/wiki-core/src/lib/lessonPresentation.ts` / `.test.ts`
- `apps/web/src/styles.css`

## Key Decisions
- **완료 기능은 표시뿐 아니라 저장 로직까지 완전 삭제** — 사용자가 "체크 및 표시는 다 삭제"라고 명시. `lastLessonSlug`/`lastSceneId`(이어서 학습하기 기능)는 유지.
- **목록 카드 설명은 `lesson.presentation` 첫 씬에서 추출, 실패 시 `lesson.summary` 폴백** — Codex 리뷰에서 지적된 "customHtml만 있는 씬일 때 빈 설명" 문제를 폴백으로 방지.
- **narration 문장 분리는 정규식 대신 문자 단위 스캔** — 최초 정규식 구현이 소수점/공백 없는 구두점에서 텍스트를 유실하는 버그가 있어 Codex 리뷰 후 교체.
- **`transitionToNext` 배너는 `position: fixed`** — 스크롤 위치와 무관하게 우측 하단에 고정되는 것이 사용자가 참조한 사이트 스타일 요구사항이었음. 하단 바보다 z-index를 높여 safe-area로 인한 가림을 방지.

## Open Gaps
- 없음(요청 10건 모두 완료, Codex 지적 3건 모두 수정 완료).

## Next Steps
- 없음.
