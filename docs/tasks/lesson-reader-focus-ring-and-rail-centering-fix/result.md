# lesson-reader-focus-ring-and-rail-centering-fix Result

## Delivered Scope
사용자가 스크린샷을 캡처해 지적한 3가지 문제를 모두 수정했다.

1. 씬 타이틀에 항상 떠 있던 빨간 포커스 링 제거(`focus-visible:outline*` 클래스 삭제 — 프로그램적 focus() 호출만으로 스크린리더 접근성은 유지).
2. "다음 페이지" 사이드 레일을 상단(타이틀 옆)에서 화면 우측 하단 고정으로 이동(원래 정한 "우측 하단 고정" 의도 복원).
3. 사이드 레일 도입으로 인해 왼쪽으로 밀렸던 본문 콘텐츠를 다시 정중앙으로 복원(그리드 대신 `position: fixed`로 레일을 완전히 독립).

## Changed Files
- `apps/web/src/ui/pages/LessonReaderPage.tsx`
- `apps/web/src/styles.css`

## Key Decisions
- **레일은 `position: fixed`로 콘텐츠와 완전히 독립** — 그리드로 콘텐츠+레일을 한 블록으로 묶어 함께 중앙 정렬하는 접근은 콘텐츠 자체의 중심을 옮겨버려 폐기. `content-relative absolute` 배치도 시도했지만, 씬이 짧으면 콘텐츠 끝이 하단 dock(전체 폭 고정) 영역과 겹쳐 레일이 완전히 가려지는 문제를 실측으로 발견해 최종적으로 폐기.
- **레일의 `bottom`은 하단 dock의 실측 높이(`--lesson-reader-dock-height`)를 그대로 재사용** — dock 높이가 씬마다 달라져도 레일이 항상 그 위에 뜨는 것을 보장.
- **노출 breakpoint를 xl(1280px)에서 2xl(1536px)로 상향** — 콘텐츠 폭(1024px, lg:max-w-5xl)을 줄이지 않고 정중앙을 지키려면, 레일(220px)+여백이 편측에 실제로 들어갈 폭이 남는 지점부터 켜야 하기 때문. 사용자가 이전에 확인한 "작은 노트북에서도 충분하다"는 폭보다 넓어졌을 수 있음 — 콘텐츠 정중앙 유지를 우선한 트레이드오프.

## Open Gaps
- 없음.

## Next Steps
- 없음.
