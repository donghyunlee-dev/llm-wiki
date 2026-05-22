# guide-graph-view-ux-improvements Result

## Delivered Scope

### 버그 수정
- SVG 엣지 invisible 버그: `stroke-width: 0.18` (0.18 screen-pixel) → `1.2` 수정
- SVG pointer-events 클릭 차단 버그: `guide-graph-links`에 `pointer-events: none` 추가
- 노드 캡션 색상 버그: `text-page-fg` (다크 텍스트) → `rgba(255,255,255,0.80)` + text-shadow
- 노드 배경 불투명도 10–20% → 32–38%로 개선
- 페이지 레이아웃 breakout 제거: `max-w-7xl` 표준 레이아웃으로 정상화

### 점진적 확대 인터랙션
- Overview / Focused 2단계 상태 머신 구현
- `expandedGroupId` React state로 어느 index가 확장됐는지 추적
- CSS `data-state` attribute로 각 노드 상태(overview-index/focused-index/dimmed-index/visible-child/hidden) 제어
- `transition: opacity 0.28s ease, transform 0.30s ease`로 부드러운 전환
- Focus bar: 선택된 index 제목, 연결 문서 카운트, "문서 열기" 링크, "← 전체 보기" 버튼

### 레이블 가독성
- `parseNodeLabel()`: `[PREFIX] 페이지명` → `{abbrev, name}` 분리
  - index 노드: prefix 최대 2글자를 원 내부에 표시
  - child 노드: prefix 1글자를 원 내부에 표시
  - bracket 없는 문서: 첫 글자를 약어로 사용
- 원 아래 전체 페이지명 표시 (자르기 없음)
- 노드 크기: overview 3rem, focused 2.8rem (기존 4rem/3.4rem 대비 축소)

### 정리
- 하단 "선택된 index" / "대시보드" 섹션 제거
- 고립/끊긴참조 노드: 두 상태 모두 hidden (통계 칩으로만 표시)
- hover scale 제거 → data-state 기반 전환으로 통일

## Changed Files

- `apps/web/src/ui/pages/GuideIndexGraphPage.tsx`
- `apps/web/src/ui/pages/GuideIndexGraphPage.test.tsx`
- `apps/web/src/ui/guideIndexGraph.ts` (placeGraphNodes clamping)
- `apps/web/src/styles.css` (guide-graph 섹션 전체 재작성)

## Key Decisions

- 모든 노드를 DOM에 유지하고 CSS로 visibility 제어 → React re-render 없이 CSS transition 활용
- index 노드만 overview에 표시 → 문서 수가 많아도 초기 화면이 단순하게 유지됨
- `pointer-events: none`을 SVG에 적용 → 엣지는 장식용이며 클릭 이벤트 불필요
- prefix 약어를 원 내부에 배치 → 원 크기를 줄여도 문서 식별 가능

## Open Gaps

- 클러스터가 3개 이상일 때 index 노드 레이블이 인접 노드와 겹칠 수 있음
- focused 상태에서 child 노드가 많으면 위치 겹침 발생 가능 (레이아웃 알고리즘 개선 별도 검토 필요)
- 키보드 탐색 (Tab → Enter 확장) 기본 구현 완료, 세부 접근성 검증 미실시
