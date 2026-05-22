# guide-graph-view-ux-improvements Spec

## Problem Statement

- guide-index-graph-view 초기 구현에서 SVG 엣지가 보이지 않고, 노드 색상이 투명에 가까워 실사용이 불가능했다.
- 페이지 레이아웃이 전체 viewport를 불필요하게 점유하는 breakout 방식으로 렌더링되어 프레임이 틀어져 보였다.
- 모든 문서 노드가 한번에 표시되어 문서가 많을수록 겹치고 식별이 불가능했다.
- 노드 레이블이 너무 작고(8px 미만), 문서명 앞의 `[PREFIX]` 표기 포함 시 공간을 낭비했다.

## Business Context

- 가이드 문서 구조를 한눈에 파악하는 것이 운영자의 핵심 니즈이며, 사용할 수 없는 시각화는 의미가 없다.
- index → 하위 문서 관계를 직관적으로 탐색하려면 점진적 노출(progressive disclosure) 패턴이 필요하다.
- 문서명이 보여야 어느 노드가 어느 문서인지 알 수 있다.

## Scope

- SVG 엣지 stroke-width 버그 수정 (non-scaling-stroke + 0.18px → 1.2px)
- 노드 배경 불투명도 개선 (10–20% → 32–38%)
- 노드 캡션 색상 수정 (page-fg 다크 색상 → rgba(255,255,255,0.8))
- 페이지 레이아웃 정상화 (breakout 제거, max-w-7xl 표준 레이아웃)
- 점진적 확대 인터랙션 구현: Overview → Focused 2단계 상태
- 노드 클릭으로 해당 index 그룹 확장, 재클릭 또는 리셋 버튼으로 복귀
- 하단 "선택된 index" / "대시보드" 섹션 제거 → Focus bar로 교체
- `[PREFIX]` bracket 파싱: prefix 약어를 원 내부에, 실제 페이지명을 원 아래에 표시
- 노드 크기 조정: overview index 3rem, focused index 2.8rem
- 전체 문서명 표시 (문자 자르기 제거)

## Out Of Scope

- 검색 ranking 변경
- 드래그 가능한 캔버스 그래프
- Confluence write-back
- 고립/끊긴참조 노드의 focused 뷰 내 표시
- 레이아웃 알고리즘 전면 교체

## Acceptance Criteria

- AC1: index 노드를 클릭하면 해당 그룹의 연결 문서가 애니메이션과 함께 펼쳐진다
- AC2: 같은 index 노드를 다시 클릭하거나 "← 전체 보기" 버튼으로 overview 상태로 돌아간다
- AC3: overview 상태에서 index 노드만 표시되며 레이블이 명확히 읽힌다
- AC4: 노드 내부에 prefix 약어가, 노드 아래에 페이지명 전체가 표시된다
- AC5: SVG 엣지가 focused 상태에서 정상적으로 보인다
- AC6: 페이지 레이아웃이 다른 페이지와 동일하게 정렬된다

## Edge Cases

- bracket prefix가 없는 문서: 첫 글자를 약어로 사용
- index 문서가 0개: 빈 상태 메시지 표시
- 검색 입력 시: expandedGroupId를 null로 리셋
- 연결 문서가 0개인 index: focused 상태에서 index 노드만 보임 (엣지 없음)
