# home-faq-entry-link Spec

## Problem Statement
`/faq` 목록 페이지, 라우트, `CategoryPage` UI는 모두 정상 구현되어 있지만, 홈 화면·사이트 헤더 어디에도 `/faq`로 이동하는 내비게이션 링크가 없어 사용자가 URL을 직접 입력하지 않는 한 FAQ 목록에 접근할 방법이 없다.

## Business Context
사용자가 "FAQ 리스트를 볼 수 있는 방법이 없다"고 리포트. 조사 결과 2026-05-19에 홈 화면 단순화 목적으로 FAQ 진입 블록이 의도적으로 제거된 이력이 있고(`implementation-status.md`), `search-flow-contract.md`에는 "FAQ는 검색 화면의 별도 `faq` 섹션에서만 노출된다"는 문구가 있었다(단, 이는 AI 검색 답변 내 문서 노출 규칙이며 정적 내비게이션과는 무관함을 계약 문서에 명확히 구분해 추가함). 사용자 확인 결과, 사이트 헤더 전역 내비게이션 개편이 아니라 홈 화면에 FAQ 진입 링크만 추가하는 좁은 범위로 진행한다.

## Scope
- `packages/wiki-core/src/lib/homeContent.ts`에 이미 존재하는 `entryCards` 중 FAQ 항목(`{ title: "FAQ", description: "자주 묻는 질문을 확인하세요.", href: "/faq" }`) 데이터를 사용해, 홈 화면의 "추천 가이드" 섹션 헤더에 기존 "전체 보기"(가이드) 링크와 같은 스타일로 FAQ 진입 링크를 추가한다.

## Out Of Scope
- 사이트 헤더(SiteHeader) 전역 내비게이션 추가.
- `entryCards`의 나머지 3개 카드(시작 가이드/프로젝트 사례/자료실) 노출.
- FAQ 목록 페이지 자체의 UI 변경.

## User Or Operator Scenarios
- 사용자가 홈 화면에서 "추천 가이드" 섹션 헤더의 FAQ 링크를 클릭하면 `/faq` 목록 페이지로 이동한다.

## Acceptance Criteria
- AC1: 홈 화면에 "FAQ" 텍스트의 링크가 보이고 클릭 시 `/faq`로 이동한다.
- AC2: 기존 "전체 보기" 링크(가이드)의 위치/동작에 회귀가 없다.
- AC3: 새로운 색상 값 추가 없이 기존 `home-secondary-button` 스타일을 재사용한다.

## Edge Cases
- 헤더 영역이 좁은 모바일 뷰포트에서 두 링크가 겹치거나 줄바꿈되지 않는지 확인.

## Assumptions
- `entryCards` 데이터의 title("FAQ")을 링크 텍스트로 그대로 사용해도 충분히 명확하다.

## Clarifications
- Q: FAQ 진입 링크를 사이트 헤더에 넣을지, 홈 화면에만 넣을지?
- A: 홈 화면에만 추가(사용자 승인). 헤더 전역 개편은 범위 밖.
