# search-page-typing-lag-fix Spec

## Problem Statement
- `/search` 페이지 하단 검색 입력창(`PromptComposer`)에 타이핑할 때 글자가 입력 속도보다 느리게 화면에 반영된다. 대화(턴)가 쌓일수록 지연이 심해진다.

## Business Context
- 검색 결과 페이지에서 후속 질문을 이어 입력하는 흐름이 위키 AI 검색의 핵심 UX인데, 타이핑 지연은 이 흐름을 직접 저해한다.

## Scope
- `SearchPage.tsx`에서 입력창 상태(`draftQuestion`) 변경이 완료된 대화 턴(`liveTurns`)에 대한 추천 문서 재계산(`resolveTurnContext` → `buildFallbackRecommendedDocuments`/`buildFaqRecommendations`/`resolveSearchDocumentSections`)과 과거 답변의 마크다운 재파싱(`StructuredAnswerView`)을 매 키 입력마다 다시 실행시키는 문제를 제거한다.

## Out Of Scope
- 검색/추천 랭킹 알고리즘 자체의 로직 변경.
- `PromptComposer`의 textarea 자동 높이 조절 로직 변경.
- 다른 화면(홈, 가이드 상세 등)의 검색/추천 컴포넌트 변경.

## User Or Operator Scenarios
- 사용자가 검색 결과 화면에서 답변을 받은 뒤, 하단 입력창에 후속 질문을 빠르게 타이핑한다 — 입력한 글자가 지연 없이 즉시 화면에 나타나야 한다.
- 대화가 여러 턴 누적된 상태에서도 타이핑 반응성이 저하되지 않아야 한다.

## Acceptance Criteria
- AC1: `draftQuestion` 상태 변경 시 완료된 턴들의 추천 문서 재계산(`resolveTurnContext`/`accumulateSearchContext`)이 다시 실행되지 않는다(동일한 `liveTurns`/`documents` 참조에서는 memoized 결과 재사용).
- AC2: `draftQuestion` 상태 변경이 이미 렌더링된 과거 턴(`chat-turn`)의 리렌더/재계산을 유발하지 않는다.
- AC3: 기존 검색 결과 화면의 렌더링 결과(추천/관련 문서, 답변 렌더링)는 변경 전과 동일하다 — 회귀 없음.

## Edge Cases
- 첫 턴 진행 중(`liveTurns`가 비어 있음)에도 타이핑이 정상 동작해야 한다.
- 새 턴이 완료되어 `liveTurns`가 갱신될 때는 추천 문서가 정상적으로 재계산되어야 한다(memoization이 갱신을 막지 않아야 함).

## Assumptions
- 성능 저하의 근본 원인은 `SearchPage`의 상태 구조(입력값과 대화 데이터가 같은 컴포넌트에서 관리됨)이며, 별도의 외부 라이브러리 도입 없이 `useMemo`/`React.memo` 수준의 최소 변경으로 해결 가능하다.

## Clarifications
- 없음 (사용자가 원인 설명 후 즉시 "진행해줘"로 승인).
