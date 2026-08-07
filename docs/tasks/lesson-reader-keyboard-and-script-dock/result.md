# lesson-reader-keyboard-and-script-dock Result

## Delivered Scope
1. 키보드 씬 이동을 ArrowLeft/ArrowRight(+Home/End)만으로 제한, Space/PageDown/PageUp 제거.
2. "교육 설명" 패널을 하단 컨트롤 바와 함께 고정 dock으로 묶고, 패널 본문 자체에 스크롤을 줘서 페이지 전체가 늘어나지 않게 함.
3. "숨기기/보기" 텍스트 버튼을 회전하는 셰브론 아이콘으로 교체, 접으면 컨트롤 바에 붙은 슬림 헤더로 축소.

## Changed Files
- `apps/web/src/ui/pages/LessonReaderPage.tsx` / `.test.tsx`
- `apps/web/src/styles.css`

## Key Decisions
- **`position: sticky` → `position: fixed` + `ResizeObserver`로 전환** — dock(교육 설명+컨트롤 바)을 sticky로 묶는 첫 시도는 dock이 문서 흐름에 남아 문서 전체 높이를 늘려서, 콘텐츠가 짧은 씬에서 항상 "문서 길이 - 뷰포트 높이"만큼 실제 콘텐츠와 겹치는 근본적인 문제가 있었다. `fixed`로 문서 흐름에서 완전히 빼고, dock 높이를 `ResizeObserver`로 실측해 정확한 만큼만 본문 하단에 여백을 주는 방식으로 재작업 — vh 기반 추정치보다 훨씬 정확하고 어떤 씬 길이에도 대응한다.
- **`transitionToNext` 배너를 dock 안으로 이동** — 독립된 `position: fixed` 배너는 dock 높이가 가변적이라 겹치는 문제가 있었음(Codex 리뷰로 발견). dock의 정상 흐름 안에 두면 항상 정확히 함께 움직인다.
- **초기 화면에서 콘텐츠 일부가 dock에 가려질 수 있는 것은 허용** — 씬 콘텐츠(카드 그리드 등)가 유난히 길면 스크롤 전 화면에서 dock과 살짝 겹칠 수 있지만, 스크롤하면 항상 완전히 드러나고 패널 자체 텍스트는 페이지 스크롤과 무관하게 항상 읽을 수 있어 실사용에 문제가 없다고 판단.

## Open Gaps
- 없음.

## Next Steps
- 없음.
