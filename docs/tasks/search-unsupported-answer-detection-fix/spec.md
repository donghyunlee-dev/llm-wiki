# search-unsupported-answer-detection-fix Spec

## Problem Statement
AI 검색에서 근거 문서가 없다고 답변했는데도(예: "현재 위키에 'claude dispatch' 기능에 대한 별도 페이지가 없습니다") `추천 페이지`/`관련 페이지`가 노출됨 — `docs/prd/search-flow-contract.md`가 이미 명시한 "완전 미지원 응답은 두 배열을 모두 비운다" 규칙 위반.

## Root Cause
`isFullyUnsupportedSearchAnswerState()`가 `confluenceData` 비어있음 **그리고** (`unsupportedClaims` 있음 **또는** 답변 텍스트가 하드코딩된 정규식(`^현재 위키에 해당 주제에 대한 페이지가 없습니다`, `^관련 문서를 찾지 못했습니다`)에 매치)라는 두 개의 불안정한 AI 자유출력 신호에 의존했음. 모델이 `unsupportedClaims`를 채우지 않고, 답변 문구도 정규식과 조금이라도 다르게 표현하면(예: `"I'm sorry, but ...정리된 페이지가 없습니다"`) 두 조건 모두 실패해 완전 미지원으로 판정되지 않고, 랭킹 기반 fallback 후보로 추천/관련 페이지가 채워짐.

라이브 재현: 동일 주제를 여러 문구로 질문했을 때 AI의 `unsupportedClaims` 채움 여부와 답변 문구가 매번 달라짐을 확인 — 이 중 하나가 "I'm sorry, but 현재 위키에 ...라는 주제로 정리된 페이지가 없습니다" + `unsupportedClaims: []` 조합으로 나와 버그를 실제로 재현함.

## Fix
`confluenceData`(AI가 실제로 인용한 근거 문서 pageId+quote 배열, 구조화된 필드)가 비어있는지만으로 완전 미지원 여부를 판정하도록 단순화. AI는 Confluence 안의 내용으로만 답하도록 지시받으므로, 이 필드가 비어있다는 것 자체가 곧 근거 문서가 없다는 뜻 — 답변 문구나 `unsupportedClaims` 채움 여부와 무관하게 안정적으로 판정 가능.

## Scope
- `packages/wiki-core/src/lib/searchAnswerState.ts`의 `isFullyUnsupportedSearchAnswerState()`
- `docs/prd/search-flow-contract.md`의 관련 규칙 갱신

## Out of Scope
- `isNoPageStyleSearchAnswer`/`NO_PAGE_ANSWER_PATTERNS` 자체 제거 — `aiOrchestration.ts`의 `normalizeUnsupportedClaimsForSearchResult`(AI가 채우지 않은 `unsupportedClaims` 필드에 대체 메시지를 채우는 용도)에서 여전히 사용 중이라 유지.
- 별개로 보고된 index 페이지(`[FAQ] Index` 등 `nav` 외 docType의 인덱스/허브 문서)가 추천 페이지에 노출되는 이슈 — 사용자가 별도로 정리 후 진행하기로 보류.

## Acceptance Criteria
- AC1: `confluenceData`가 비어있으면 `unsupportedClaims` 유무나 답변 문구와 무관하게 `recommendedDocuments`/`relatedDocuments`가 항상 빈 배열이어야 한다.
- AC2: `confluenceData`가 채워져 있으면(실제 근거 문서 있음) 기존처럼 추천/관련 페이지가 정상 노출되어야 한다.
- AC3: 라이브 Lambda에서 실제로 재현했던 실패 조합(`confluenceData: [], unsupportedClaims: []`, 문구 변형)으로 재확인 시 추천/관련 페이지가 비어야 한다.
