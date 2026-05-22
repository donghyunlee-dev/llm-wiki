# guide-graph-view-ux-improvements Tasks

## Bug Fix Tasks

- [x] SVG stroke-width 버그 수정 (`stroke-width: 0.18` → `1.2`)
- [x] SVG pointer-events 차단 버그 수정 (`.guide-graph-links { pointer-events: none }`)
- [x] 노드 캡션 색상 수정 (`text-page-fg` → `rgba(255,255,255,0.80)`)
- [x] 노드 배경 불투명도 개선 (10–20% → 32–38%)
- [x] 노드 glow/shadow 개선 (0.02 opacity → 종류별 colored glow)
- [x] 페이지 레이아웃 breakout 제거 → `max-w-7xl` 표준 레이아웃
- [x] placeGraphNodes clamping 추가 (edge case: 상단 클러스터 자식 노드 잘림)

## Interaction Tasks

- [x] `NodeState` 타입 및 `getNodeState()` 함수 구현
- [x] `expandedGroupId` 상태 추가
- [x] index 노드 onClick → `handleToggle()` 연결
- [x] `data-state` attribute 기반 CSS 전환 구현
- [x] Focus bar 컴포넌트 (선택 index 정보, "문서 열기", "← 전체 보기")
- [x] 검색 입력 시 expandedGroupId 리셋
- [x] 초기 안내 힌트 overlay

## Label & Node Size Tasks

- [x] `parseNodeLabel()` 함수: `[PREFIX] 제목` → `{abbrev, name}` 분리
- [x] 원 내부 약어 표시 (`.guide-graph-node-abbrev`)
- [x] 전체 페이지명 표시 (문자 자르기 제거)
- [x] 노드 크기 조정: overview 3rem, focused 2.8rem
- [x] 상태별 caption font-size (overview/focused: 9px, child: 8px)

## Cleanup Tasks

- [x] 하단 "선택된 index" / "대시보드" 섹션 제거
- [x] `guide-graph-layout`, `guide-graph-rail` 미사용 CSS 제거
- [x] `page-width` 클래스 충돌 제거
- [x] hover scale 제거 → data-state 기반 전환으로 교체

## Test Tasks

- [x] GuideIndexGraphPage.test.tsx assertion 현행화
- [x] 전체 test suite 통과 확인 (25/25)
- [x] web app typecheck 통과 확인
- [x] 브라우저 수동 검증: /guides/map

## Documentation Tasks

- [x] spec.md 작성
- [x] plan.md 작성
- [x] tasks.md 작성
- [x] test-result.md 작성
- [x] result.md 작성
