# lesson-reader-ui-cleanup Plan

## Impacted Areas
- `apps/web/src/ui/pages/LessonReaderPage.tsx` — 상단 카운터 마크업
- `apps/web/src/ui/pages/LessonReaderPage.test.tsx` — 카운터 관련 기존 테스트 갱신
- `apps/web/src/ui/pages/LessonOutlineDrawer.tsx` — 레슨/씬 목록 마크업 단순화
- `apps/web/src/ui/pages/LessonOutlineDrawer.test.tsx` — 갱신
- `apps/web/src/styles.css` — `.lesson-reader-nav-button` 대비 개선, outline 리스트 관련 클래스 정리

## Approach
1. **상단 카운터**: `globalPosition ? 전체 카운터만 : 이 레슨 카운터만` 렌더링하도록 JSX 분기. 별도 CSS 변경 불필요(기존 `.lesson-reader-progress-item` 재사용).
2. **이전 버튼 대비**: `.lesson-reader-nav-button`에 `bg-card-bg` 대신 배경이 뚜렷이 구분되는 톤(예: `bg-panel-bg`보다 밝거나 어두운 대비 색, 또는 `border` 강도 상향)을 적용. 라이트/다크 테마 변수 값을 참조해 실제로 대비가 생기는 값으로 조정.
3. **학습 흐름 드로어**: 레슨 제목 줄(`lesson-outline-lesson-title` + `lesson-outline-lesson-minutes`)을 제거하고, 챕터 헤더 아래 씬 버튼 목록만 남긴다. 씬이 1개인 레슨은 그 씬의 제목이 곧 레슨 타이틀 역할을 한다. 인덱스 뱃지(`lesson-outline-scene-index`)는 유지해 순서를 보여준다.

## Validation Plan
- `pnpm test` (LessonReaderPage.test.tsx, LessonOutlineDrawer.test.tsx 포함)
- `pnpm typecheck`
- Playwright: remote 모드 dev 서버로 실제 레슨 진입 → 상단 카운터 단일 표시 확인, "이전" 버튼 대비 확인(1페이지 이후 이동), "학습 흐름" 드로어 오픈 후 목록 확인 — 라이트/다크 테마 둘 다 확인
- Codex 비판 리뷰 (diff 전달)

## Risks
- CSS 대비 조정이 다른 곳에서 재사용되는 `.lesson-reader-nav-button` 스타일에 영향(현재 이 클래스는 레슨 리더 이전/다음 버튼에만 쓰임 — 확인 필요).
- 드로어 마크업 변경 시 포커스 트랩/키보드 테스트(Tab wrap-around 등 기존 테스트)가 셀렉터 변경으로 깨질 수 있음 — 테스트 업데이트 시 함께 확인.
