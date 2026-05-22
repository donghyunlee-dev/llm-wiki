# page-doctype-search-visibility Spec

## Problem Statement

`page` docType 문서가 `/guides` 카테고리 목록과 내부 검색에 나타나지 않는다.
`CategoryPage.tsx`의 guides 섹션 필터가 `docType === "guide"` 만 허용하기 때문.

## Business Context

Confluence 메타데이터 정의(`docs/prd/confluence-metadata.md`)에서 `page` docType은
설치·설정·실행·설명 단위 문서이며, 앱 카테고리가 `guides`로 명시되어 있다.
사용자는 `/guides`를 탐색하거나 해당 페이지 내 검색 박스로 `page` 문서를 찾을 수 없다.
AI 검색 결과에는 노출되지만, 브라우징·카테고리 탐색 경로가 없다.

## Scope

- `CategoryPage.tsx`: guides 섹션의 docType 필터를 `guide | page` 모두 허용하도록 수정
- `CategoryPage.test.tsx` 또는 관련 테스트 파일: page docType 표시 커버리지 추가

## Out Of Scope

- `/faq`, `/library` 섹션 동작 변경 없음
- AI 검색 파이프라인 변경 없음
- ArticlePage 변경 없음 (이미 page docType 라우팅 정상 동작)
- `page` docType의 시각적 구분 레이블 추가 (별도 작업으로 분리)

## User Or Operator Scenarios

- Scenario 1: `/guides` 방문 시 `page` docType 문서가 목록에 표시된다.
- Scenario 2: `/guides` 내 검색 박스로 `page` docType 문서의 제목을 검색하면 결과가 나온다.
- Scenario 3: `guide` docType 문서는 기존과 동일하게 표시된다 (회귀 없음).
- Scenario 4: intro guide 문서 숨김 동작은 유지된다.

## Acceptance Criteria

- AC1: guides 섹션 문서 목록에 `docType === "page"` 문서가 포함된다.
- AC2: guides 섹션 클라이언트 검색으로 `page` 문서를 찾을 수 있다.
- AC3: `guide` docType 문서 표시에 회귀가 없다.
- AC4: intro guide 문서 숨김 동작이 유지된다.

## Edge Cases

- `page` docType 문서가 없을 때 목록이 비어도 에러 없이 렌더링된다.
- `guide`와 `page` 혼합 목록 정렬이 올바르게 동작한다.

## Assumptions

- `getWikiDocumentSection`이 `page` → `guides` 매핑을 이미 올바르게 처리한다.
- `ArticlePage`에서 `/guides/:slug` 접근은 이미 정상 동작한다.
