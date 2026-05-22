# Spec: docType 분류 체계 전면 교체

## Problem

현재 12종 docType(overview/concept/tutorial/howto/reference/troubleshooting/example/index/router/registry/ops/policy)은 검색·노출 규칙과 불일치. 사용자 목록, 추천, 검색 결과에 nav(인덱스) 문서가 노출되고 있음.

## New docType 5종 정의

| docType | 검색 내부 사용 | 사용자 목록 | 추천/관련 노출 | 비고 |
|---|---|---|---|---|
| nav | 사용 (AI 탐색) | 제외 | 제외 | Index, Getting Started, 최상위 탐색 문서 |
| guide | 사용 | 노출 | 노출 | 추천 가이드, 관련 가이드, 추천 중심 |
| page | 사용 | 노출 | 보조 | 설치·설정·설명 단위 페이지, guide에서 링크 |
| policy | 사용 (AI 답변) | 제외 | 제외 | 정책 문서, AI 답변 시 정책 반영용 |
| ops | 제외 | 제외 | 제외 | 운영 전용, 검색·노출 없음 |

## Scope

- `packages/wiki-core/src/lib/confluenceReadModel.ts` — RawConfluencePage docType 타입 교체
- `packages/wiki-core/src/lib/wikiDocuments.ts` — WikiDocument docType 타입, isIndexWikiDocument, getSearchDocTypeAffinity, rankSearchDocumentsIn
- `packages/wiki-core/src/lib/confluenceSnapshots.ts` — 스냅샷 데이터 docType 값 업데이트
- `apps/web/src/ui/pages/WikiDocumentListItem.tsx` — DOC_TYPE_LABELS
- `apps/web/src/ui/pages/CategoryPage.tsx` — 목록 노출 필터
- `apps/web/src/ui/pages/HomePage.tsx` — 추천 가이드 필터
- `apps/web/src/ui/searchRecommendations.ts` — 사용자 결과 필터
- `apps/web/src/ui/pages/ArticleAskPanel.tsx` — suggestedNextPages nav/ops 필터
- `apps/web/vite.config.ts` — ad-hoc 패턴 필터 → docType 체크로 교체
- `apps/web/src/ui/guideIndexGraph.ts` — docType !== "index" → "nav"
- 관련 테스트 파일 — docType 값 업데이트

## Out of Scope

- Confluence 실제 페이지 docType 변경 (사용자가 직접 진행 중)
- 카테고리 구조 변경

## Acceptance Criteria

- [ ] 구 12종 docType 타입 전부 제거, 신 5종으로 교체
- [ ] nav 문서가 사용자 목록(CategoryPage, HomePage)에 노출되지 않음
- [ ] guide 문서만 추천 가이드(HomePage featured)에 노출
- [ ] 검색 결과 카드에 nav 문서 미노출
- [ ] isIndexWikiDocument가 docType === "nav" 기준으로 작동
- [ ] 스냅샷 데이터 전부 신 5종으로 정합
- [ ] pnpm typecheck 통과
- [ ] pnpm test 통과
