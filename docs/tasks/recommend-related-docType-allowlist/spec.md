# recommend-related-docType-allowlist Spec

## Problem Statement
`[FAQ] Index`(docType: `faq`)처럼 `nav`가 아닌 docType의 인덱스/허브 문서가 AI 검색·Ask 패널의 `추천 페이지`/`관련 페이지`에 노출됨. 근본 원인은 노출 판정이 "제외 목록"(docType이 `nav`/`ops`/`policy`/`playbook`이면 제외) 방식이라, `faq`/`library` 등 새 docType이 늘어날 때마다 놓치기 쉬운 구조였음.

## Decision
사용자 확인: "FAQ 타입 자체가 페이지가 아니기 때문에 1차 제외 조건이어야 할 것 같아. guide, page만 추천, 관련 페이지에 나와야 할 리스트 대상이어야 해. 제외가 아니라 선택으로 하면 쉽게 처리가 될 것 같아."

→ 제외 방식(blacklist)을 선택 방식(whitelist)으로 전환: **`추천 페이지`/`관련 페이지`에는 docType이 `guide` 또는 `page`인 문서만 나온다.** FAQ는 검색 화면의 별도 `faq` 섹션(`buildFaqRecommendations`)에서만 노출되므로 이 변경과 무관하게 정상 동작한다.

## Scope
- `packages/wiki-core/src/lib/aiOrchestration.ts`: AI 검색의 `rankingRecommendedDocuments`, `aiRecommendedDocuments` 필터
- `apps/web/src/ui/pages/ArticleAskPanel.tsx`: Ask 패널의 `suggestedNextPages` 렌더 필터
- `apps/web/src/ui/searchRecommendations.ts`: 클라이언트 fallback `buildFallbackRecommendedDocuments` 필터
- `docs/prd/search-flow-contract.md` 갱신

## Out of Scope
- 검색 인덱스 확장 단계(`getIndexFirstSearchWikiDocumentsIn`, `expandDetailDocumentsFromIndexes`)의 `nav` 기반 index 문서 탐색 로직 — 이건 추천/관련 페이지 노출과 무관한, 검색 후보 확장 전용 메커니즘이라 그대로 유지.
- `/guides/map` 그래프 뷰(`guideIndexGraph.ts`)의 `nav` 포함 로직 — 별개 화면, 별개 목적.
- AI Ask의 프롬프트 컨텍스트 구성(`relatedDocuments`/`contextDocuments`, AI가 답변 생성 시 참고하는 배경 문서) — 이건 화면에 보이는 추천/관련 페이지 목록이 아니라 AI 입력 컨텍스트라 이번 스코프 밖.

## Acceptance Criteria
- AC1: AI 검색의 `recommendedDocuments`/`relatedDocuments`에는 docType이 `guide` 또는 `page`인 문서만 나온다.
- AC2: Ask 패널의 `suggestedNextPages` 렌더 결과에도 동일하게 적용된다.
- AC3: 클라이언트 fallback 추천 목록에도 동일하게 적용된다.
- AC4: FAQ 섹션(`buildFaqRecommendations`)은 이번 변경과 무관하게 그대로 동작한다.
- AC5: 실제 배포된 `ai-search` Lambda에서 `[FAQ] Index` 문서가 더 이상 추천/관련 페이지에 나오지 않음을 라이브로 확인한다.
