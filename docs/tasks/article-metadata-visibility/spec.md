# article-metadata-visibility Spec

## Problem Statement
- 상세 문서 페이지(`ArticlePage`) 상단의 metadata 칩(docType, audience, updatedAt)이 `<details>` 토글 안으로 이동되어 기본 숨김 상태가 됨
- Confluence 페이지 본문에 포함된 `wiki.metadata` 코드 블록이 일반 사용자에게 그대로 노출됨

## Business Context
- 상단 metadata 칩은 문서 유형과 대상 독자를 빠르게 파악하는 데 유용한 정보이므로 항상 표시되어야 함
- `wiki.metadata` 코드 블록은 Confluence 편집자가 사용하는 내부 구조 데이터로, 일반 사용자가 볼 필요가 없음

## Scope
- `ArticlePage.tsx`: 상단 metadata 칩을 항상 표시되도록 복구
- `ArticleContentRenderer.tsx`: `wiki.metadata`로 시작하는 코드 블록을 접을 수 있는 `<details>`로 처리

## Out Of Scope
- `WikiDocumentListItem.tsx` 변경 없음
- metadata 데이터 구조 변경 없음
- `wiki.metadata` 파싱 로직 변경 없음

## User Or Operator Scenarios
- 일반 사용자가 문서 상세 페이지 진입 시 docType, audience, updatedAt 칩이 즉시 보임
- 일반 사용자가 문서 하단에서 `wiki.metadata` 코드 블록을 보지 않음 (기본 접힘)
- 필요 시 "문서 메타데이터" 토글을 클릭해 `wiki.metadata` 내용을 확인할 수 있음

## Acceptance Criteria
- AC1: 상세 페이지 상단에 docType, audience, updatedAt 칩이 항상 노출됨
- AC2: 본문 내 `wiki.metadata` 코드 블록은 기본 접힘 상태로 렌더링됨
- AC3: 토글 클릭 시 `wiki.metadata` 내용이 펼쳐짐
- AC4: 다른 일반 코드 블록은 영향받지 않음

## Edge Cases
- `wiki.metadata` 텍스트가 코드 블록 첫 줄에 있되 앞에 공백이 있는 경우 → trimStart() 후 비교
- `<div>` 기반 Confluence 코드 블록에도 동일하게 적용

## Assumptions
- `wiki.metadata` 코드 블록은 항상 해당 텍스트로 시작함
