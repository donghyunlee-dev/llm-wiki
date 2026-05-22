# Plan: docType 분류 체계 전면 교체

## Approach

### 1. 타입 정의 교체 (wiki-core)

**confluenceReadModel.ts** — RawConfluencePage.metadata.docType union 교체
**wikiDocuments.ts** — WikiDocument.metadata.docType union 교체, 하위 로직 재작성:

- `rankSearchDocumentsIn`: ops 타입을 사전 필터로 제외
- `isIndexWikiDocument`: 텍스트 기반 휴리스틱 제거 → `docType === "nav"` 단순 체크
- `getSearchDocTypeAffinity`: guide/page/nav/policy 기준으로 재작성
  - guide: concept·planning·general에서 높은 우선순위
  - page: setup·troubleshooting에서 높은 우선순위
  - nav: 스코어 0 (조건부 맥락 확장용, 최종 사용자 결과에는 제외)
  - policy: 낮은 스코어 (AI 답변 전용, 사용자 결과 미노출)

### 2. 스냅샷 데이터 매핑

| slug | old docType | new docType | 이유 |
|---|---|---|---|
| guide-index | overview | nav | 인덱스 문서 |
| agent-start | tutorial | nav | Getting Started 진입 문서 |
| wiki-usage | howto | guide | 사용자가 따라가는 가이드 |
| project-design-start | howto | guide | 단계형 가이드 |
| approval-tool | example | page | 세부 사례 페이지 |
| weekly-report-automation | example | page | 세부 사례 페이지 |
| internal-chatbot | example | page | 세부 사례 페이지 |
| basic-guidelines | reference | page | 참고 자료 페이지 |
| templates | reference | page | 참고 자료 페이지 |
| common-questions | reference | page | FAQ 세부 페이지 |

### 3. 프론트엔드 노출 규칙

**CategoryPage**: guides 카테고리 → `guide` 타입만 표시
  - 전체 카테고리: nav·ops·policy 일괄 제외 (상수로 정의)

**HomePage featured guides**: `docType === "guide"` 필터

**searchRecommendations.ts / buildFallbackRecommendedDocuments**:
  - `getIndexFirstSearchWikiDocumentsIn`이 이미 nav를 detailDocuments에서 제외
  - policy도 추가 필터 (wikiDataSource에서 이미 제거되지만 스냅샷 대비)

**ArticleAskPanel suggestedNextPages**: nav·ops 타입 문서 제외

**vite.config.ts**:
  - aiRecommendedDocuments의 텍스트 기반 패턴 필터 → `docType === "nav"` 체크로 교체
  - isIndexWikiDocument 업데이트 적용으로 자동 반영

### 4. 테스트 업데이트

- 기본 factory docType: `tutorial` → `guide`
- index 역할 테스트 문서: `overview`/`index` → `nav`
- concept 역할 문서: `overview` → `guide`
- setup 문서: `tutorial`/`howto` → `page`
- troubleshooting 문서: `troubleshooting` → `page`

## Risks

- 검색 스코어 재작성으로 인한 기존 테스트 케이스 조정 필요
- 스냅샷 docType 변경으로 CategoryPage 목록 결과 변동 (guide만 노출되면 wiki-usage, project-design-start만 남음)
