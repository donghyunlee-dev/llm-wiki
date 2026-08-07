# lesson-main-screen-visual-polish Plan

## Impacted Areas
- `apps/web/src/ui/pages/LessonIndexPage.tsx` (+`.test.tsx`) — 히어로 레이아웃에 SVG 삽입, 챕터별 색상 인덱스 계산
- `apps/web/src/ui/pages/LessonHeroIllustration.tsx` (신규) — SVG 컴포넌트 분리(가독성)
- `apps/web/src/styles.css` — 히어로 레이아웃(텍스트+그래픽 2열), 챕터 색상 팔레트 토큰, 관련 클래스

## Approach

### 1. 히어로 SVG 일러스트
- `<rect>`/`<circle>`/`<line>` 등 기본 도형만으로 구성(복잡한 path 데이터 직접 작성 금지) — "문서/레슨 카드" 사각형 + "AI 노드 네트워크"(점+선) 조합의 추상적 구성.
- 색은 `currentColor`/CSS 변수(`var(--accent)`, `var(--accent-soft)`, `var(--panel-border)`)로 지정해 라이트/다크 테마 전환 시 자동으로 맞춰지게 한다.
- 별도 컴포넌트(`LessonHeroIllustration.tsx`)로 분리해 `LessonIndexPage.tsx`가 너무 길어지지 않게 한다.
- 히어로를 2열 레이아웃(텍스트 왼쪽, 일러스트 오른쪽)으로 바꾸고, 좁은 화면에서는 세로로 쌓이게 한다.

### 2. 목록 챕터 색 다양화
- `useMemo`로 `outline.lessons`를 순회해 챕터명 → 색 인덱스(등장 순서) 매핑을 만든다(중복 카운터 로직 없이 `Map`으로 결정적으로 계산).
- `styles.css`에 챕터 색 팔레트 5색(라이트/다크 각각 정의)을 새 CSS 변수로 추가 — 기존 `--accent`(브랜드 레드)와 겹치지 않게.
- 챕터 헤더 텍스트 색, 레슨 행의 순번 배지 색, 좌측 강조선(border-left)에 같은 색 인덱스를 적용해 챕터 단위로 시각적으로 묶이게 한다.

## Validation Plan
- `pnpm test` / `pnpm typecheck`
- Playwright: `/lesson` 라이트/다크 테마, 데스크톱/좁은 뷰포트 확인
- Codex 비판 리뷰

## Risks
- SVG를 지나치게 장식적으로 만들면 오히려 "AI가 만든 티가 나는" 뻔한 그래픽이 될 수 있음 — 단순한 기하학적 구성을 유지해서 과함을 피한다.
- 챕터 색이 너무 많으면 산만해질 수 있음 — 5색으로 제한하고 채도/명도를 절제한다.
