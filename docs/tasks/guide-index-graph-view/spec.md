# guide-index-graph-view Spec

## Problem Statement
- Guide 문서들은 index 페이지를 중심으로 하위 페이지와 연결되도록 구조화되어 있지만, 현재는 그 연결 구조를 한 화면에서 빠르게 확인할 수 있는 전용 뷰가 없다.
- 문서를 하나씩 열어보지 않으면 index, child, related, prerequisite, next 연결 관계를 검증하기 어렵다.
- 캐시에 올라온 guide 문서만으로 연결 지도를 보여 주는 읽기 전용 페이지가 있으면 문서 구조 점검과 연결 품질 확인이 쉬워진다.

## Business Context
- Guide index 구조는 검색 정확도와 문서 탐색 품질의 핵심이다.
- 운영자는 어떤 index가 어떤 하위 문서를 가지는지, 연결이 끊긴 문서가 있는지, broad overview와 setup 문서가 어떤 관계인지 빠르게 확인해야 한다.
- Obsidian 스타일의 구조 뷰가 있으면 검색 품질 보정과 문서 정리 시점에 더 정확한 기준을 잡을 수 있다.

## Scope
- Guide 문서만 대상으로 하는 읽기 전용 index graph view를 추가한다.
- index 페이지를 루트로, 하위 페이지와 연결 페이지를 한 화면에서 볼 수 있게 한다.
- `parent`, `prerequisites`, `next`, `related` 관계를 함께 표시한다.
- 이미 로드된 wiki 캐시 데이터를 사용해 별도 저장소 없이 렌더링한다.
- 앱 내부에서 접근 가능한 전용 페이지와 진입 링크를 제공한다.

## Out Of Scope
- 검색 ranking 로직 변경
- AI prompt 로직 변경
- Confluence write-back
- 별도 DB, vector store, graph database 추가
- 모든 카테고리의 전체 문서 그래프를 한 번에 보여 주는 범용 뷰
- 편집/드래그/노드 재배치가 가능한 인터랙티브 그래프 편집

## User Or Operator Scenarios
- 운영자가 guide index 페이지와 하위 문서 연결을 한눈에 점검한다.
- 개발자가 `mcp` 같은 broad overview 문서와 setup 문서의 연결 상태를 빠르게 확인한다.
- 문서 정리 중에 orphan 문서, 누락 링크, 과도하게 좁은 index 범위를 발견한다.

## Acceptance Criteria
- AC1: Guide 전용 index graph view가 앱 내부에 존재하고 읽기 전용으로 동작한다.
- AC2: 뷰는 guide index 페이지를 시작점으로 하위 문서와 관계 문서를 함께 보여 준다.
- AC3: `parent`, `prerequisites`, `next`, `related` 연결이 화면에서 구분되어 보인다.
- AC4: 뷰는 이미 로드된 wiki 캐시 데이터를 사용하며 별도 저장소를 요구하지 않는다.
- AC5: guide 문서가 없는 경우나 관계가 비어 있는 경우에도 빈 상태를 안전하게 렌더링한다.
- AC6: 새 페이지에 대한 진입 링크가 앱 안에서 제공된다.

## Edge Cases
- index로 인식되는 guide 문서가 여러 개일 수 있다.
- 어떤 문서는 `parent`가 없고 `related`만 있을 수 있다.
- `prerequisites`, `next`, `related` 중 일부가 누락되거나 잘못된 ID를 가질 수 있다.
- 연결이 순환할 수 있으므로 무한 확장 없이 제한된 깊이만 표시해야 한다.
- 문서 캐시가 아직 로드되지 않았을 때는 상태 패널로 안내해야 한다.

## Assumptions
- 현재 wiki 데이터 로딩 경로는 앱 시작 시 이미 가용한 in-memory document set을 제공한다.
- guide 문서는 `category === guides` 범위로 분리할 수 있다.
- index 문서는 기존 `index` 판별 규칙과 guide 인덱스 키워드 힌트를 재사용할 수 있다.
- 이 뷰는 구조 확인용이므로 시각적 그래프보다 읽기 쉬운 카드/트리 조합이 우선이다.

## Clarifications
- Question: 이 페이지는 실제 노드-링크 캔버스여야 하나?
- Answer: 아니요. 우선은 문서 연결 구조를 빠르게 읽을 수 있는 페이지형 맵이 적절하다. 필요하면 이후에 시각적 그래프를 추가할 수 있다.
- Question: 검색과 같은 데이터 원본을 써도 되나?
- Answer: 네. 이미 로드된 guide 문서 캐시를 재사용하되, 검색 ranking은 바꾸지 않는다.
