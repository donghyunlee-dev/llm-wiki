# guides-list-remove-eyebrow-label Spec

## Problem Statement
`/guides` 목록 페이지의 각 항목 위에 "가이드 문서"라는 라벨(eyebrow)이 반복 노출되는데, 목록 전체가 이미 가이드 문서이므로 의미 없는 반복 텍스트다.

## Business Context
사용자가 "가이드 리스트 페이지에 리스트 내용 중 [가이드문서] 텍스트가 의미없다"고 리포트. 조사 결과 실제 텍스트는 `CategoryPage.tsx`가 `section === "guides"`일 때만 `WikiDocumentListItem`에 전달하는 `eyebrow="가이드 문서"`이며, `faq`/`library` 섹션에는 전달되지 않는다.

## Scope
- `CategoryPage.tsx`에서 guides 섹션에 대해 `eyebrow="가이드 문서"`를 전달하던 로직 제거.
- `WikiDocumentListItem`의 다른 호출부가 없음을 확인했으므로, 더 이상 쓰이지 않는 `eyebrow` prop 자체와 렌더링 분기도 함께 제거.

## Out Of Scope
- 가이드 목록의 필터링/정렬 로직(frozen behavior인 guide docType only 필터는 변경하지 않음).
- `WikiDocumentListItem`의 다른 prop(`showCategory` 등).

## User Or Operator Scenarios
- 사용자가 `/guides`에 진입하면 각 목록 항목에 더 이상 "가이드 문서" 라벨이 보이지 않고 제목/요약만 보인다.

## Acceptance Criteria
- AC1: `/guides` 목록의 각 항목에 "가이드 문서" 텍스트가 더 이상 렌더링되지 않는다.
- AC2: FAQ/자료실 목록 등 다른 섹션의 렌더링에는 회귀가 없다(원래도 eyebrow가 없었으므로 변화 없음).

## Edge Cases
- 없음(단순 텍스트 제거).

## Assumptions
- 이 라벨은 UI에 아무 정보도 추가하지 않는 장식성 텍스트로 판단, 완전 제거가 적절하다(사용자 확인 완료).

## Clarifications
- Q: eyebrow 라벨을 완전히 제거해도 되는지?
- A: 예, 완전히 제거(사용자 승인).
