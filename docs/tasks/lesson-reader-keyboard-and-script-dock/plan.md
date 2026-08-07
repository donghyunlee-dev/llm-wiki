# lesson-reader-keyboard-and-script-dock Plan

## Impacted Areas
- `apps/web/src/ui/pages/LessonReaderPage.tsx` (+`.test.tsx`)
- `apps/web/src/styles.css`

## Approach
1. **키보드**: `handleKeyDown`에서 Space/PageDown/PageUp 분기 삭제, ArrowLeft/ArrowRight/Home/End만 유지.
2. **Dock 구조**: "교육 설명" 패널과 `<footer>`를 `.lesson-reader-bottom-dock` 하나로 묶어 `position: fixed; bottom:0`으로 뷰포트에 고정. 처음엔 `position: sticky`로 시도했으나, 콘텐츠가 짧은 씬에서는 sticky 특성상 "문서 전체 높이 - 뷰포트 높이"만큼 항상 실제 콘텐츠 뒷부분과 겹치는 문제가 있어 `fixed`로 전환.
3. **정확한 여백 확보**: dock 높이가 "교육 설명" 펼침/씬 길이/다음 안내 유무에 따라 계속 바뀌므로, `ResizeObserver`로 dock을 관찰해 실제 높이를 `--lesson-reader-dock-height` CSS 변수에 반영하고 `.lesson-reader-content`의 `padding-bottom`이 그 값을 그대로 쓰게 함(vh 기반 추정치는 표/카드 그리드가 있는 씬에서 부정확했음).
4. **아이콘 토글**: 회전하는 셰브론 SVG(`polyline` 2개 선분, 복잡한 path 없음)로 교체, `aria-label`로 접근성 이름 부여.
5. **transitionToNext 배너**: dock 안, 패널 위쪽에 배치해 항상 정확히 함께 움직이게 함(원래 `position: fixed` 독립 배너였으나 dock 높이가 가변적이라 겹치는 문제가 있었음).

## Validation Plan
- `pnpm test` / `pnpm typecheck`
- Playwright: 키보드(Space/PageDown/PageUp 무시, ArrowLeft/Right 동작), 패널 펼침/접힘, 다이어그램/카드 그리드가 있는 씬에서 dock 겹침 여부(겹쳐도 스크롤하면 완전히 보이는지), 라이트/다크 확인
- Codex 비판 리뷰 2회(구조 변경 1차 리뷰 → 지적 반영 → 최종 fixed+ResizeObserver 전환은 자체 검증)

## Risks
- `position: fixed` dock은 씬 콘텐츠가 유난히 긴 경우 초기 화면에 일부가 가려질 수 있음 — 스크롤하면 항상 완전히 드러나는 것을 확인했고, 패널 자체 텍스트는 페이지 스크롤과 무관하게 항상 읽을 수 있어 허용 가능한 트레이드오프로 판단.
