# search-conversation-sidebar-title Spec

## Problem Statement
검색 결과 페이지(`/search`)의 좌측 대화 목록 사이드바에는 섹션 헤딩("최근 대화")이 없어, 홈 화면과 비교했을 때 대화 목록이 무엇인지 알려주는 라벨이 보이지 않는다.

## Business Context
사용자가 "검색 결과 페이지에서는 왼쪽 대화 목록에 왜 타이틀이 안 보이는지"를 리포트. 조사 결과 `ConversationSidebar`는 `title` prop을 선택적으로 지원하고 HomePage는 이미 `title="최근 대화"`를 전달하지만, `SearchPage.tsx`는 이 prop을 전달하지 않아 헤딩이 렌더링되지 않는 상태(설계상 의도된 차이였으나, 사용자 확인 결과 홈과 동일하게 보이길 원함).

## Scope
- `SearchPage.tsx`의 `ConversationSidebar` 렌더링에 `title="최근 대화"` prop 추가.

## Out Of Scope
- 개별 대화 항목(`conversation.title`)의 표시 로직 변경.
- `ConversationSidebar` 컴포넌트 자체의 구조 변경.
- 모바일 드로어 동작 변경.

## User Or Operator Scenarios
- 사용자가 `/search`에 진입해 대화가 1개 이상 있을 때, 좌측 사이드바 상단에 "최근 대화" 헤딩이 보인다.

## Acceptance Criteria
- AC1: `/search`에서 좌측 사이드바 최상단에 "최근 대화" 텍스트가 렌더링된다.
- AC2: 홈 화면의 기존 헤딩 렌더링에는 회귀가 없다.

## Edge Cases
- 대화가 0개일 때: `SearchPage`는 대화 유무와 무관하게 항상 사이드바를 렌더링하므로(홈과 다름), 대화가 없어도 헤딩은 그대로 보인다 — 기존 동작 유지.

## Assumptions
- "최근 대화"라는 문구를 홈과 동일하게 사용하는 것이 사용자 의도와 일치한다.

## Clarifications
- Q: "타이틀이 안 보인다"는 게 섹션 헤딩인지 개별 대화 제목인지?
- A: 사용자가 섹션 헤딩("최근 대화")을 의미한다고 확인함.
