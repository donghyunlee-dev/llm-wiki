# guide-page-toc-and-entity-rendering Spec

## Problem Statement
- 가이드 페이지와 문서 페이지 목차에서 하위 heading이 들여쓰기만 있고 구분 기호가 없어 계층 구조가 눈에 잘 들어오지 않는다.
- Confluence HTML에 포함된 `&mdash;` 같은 엔티티가 렌더링 과정에서 실제 문자로 변환되지 않고 그대로 보이는 경우가 있다.

## Business Context
- 이 위키는 비개발자 사용자가 읽는 문서 중심 제품이라, 목차 구조와 본문 텍스트 가독성 문제는 탐색성과 신뢰도에 직접 영향을 준다.

## Scope
- 문서/가이드 목차에서 하위 계층 표현이 더 명확히 보이도록 스타일을 보강한다.
- Confluence HTML/heading/plain-text 변환 과정에서 일반 HTML 엔티티가 일관되게 디코딩되도록 수정한다.
- 관련 렌더/정규화 테스트를 추가한다.

## Out Of Scope
- 목차의 정보 구조 자체나 heading 추출 기준은 바꾸지 않는다.
- 검색/AI 답변/Confluence fetch 계약은 변경하지 않는다.

## User Or Operator Scenarios
- 사용자가 가이드 페이지 우측 목차를 볼 때 상위/하위 섹션 구조를 바로 파악할 수 있다.
- 사용자가 본문에서 `&mdash;`, `&nbsp;` 같은 문자를 원문 엔티티가 아니라 사람이 읽는 문자로 본다.

## Acceptance Criteria
- AC1. 문서/가이드 목차에서 level 3 이상 항목은 공백뿐 아니라 시각적 prefix가 있어 계층 구조가 드러난다.
- AC2. 본문과 heading/summary 생성에 사용되는 HTML 변환 경로에서 `&mdash;` 같은 일반 엔티티가 디코딩된다.
- AC3. 관련 회귀 테스트가 추가되고 통과한다.

## Edge Cases
- 알 수 없는 엔티티나 이미 디코딩된 문자는 이중 변환 없이 안전하게 유지되어야 한다.
- 서버 환경에서 `DOMParser`가 없는 경로도 깨지지 않아야 한다.

## Assumptions
- 주요 문제는 입력 HTML이 아니라 read model normalization과 클라이언트 렌더 경로의 엔티티 처리 부재다.

## Clarifications
- Question: 목차 구조 표시는 어떤 방식으로 보강할 것인가.
- Answer: 기존 들여쓰기는 유지하되, 하위 레벨 앞에 짧은 대시/점 형태의 prefix를 추가해 목록 구조가 한눈에 드러나게 한다.
