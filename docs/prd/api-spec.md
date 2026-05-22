# API 명세

## 기본 방향

API는 정규화된 위키 경험을 제공한다. 원시 Confluence 데이터를 그대로 노출하지 않으며, 공개 응답은 이미 공개 범위 필터링과 콘텐츠 정제를 거친 상태여야 한다.

현재 런타임에서 공개 데이터 경계는 공유 위키 문서 소스와 읽기 전용 AI 엔드포인트다. 카테고리, 아티클, 라이브러리, FAQ, 검색 페이지는 별도 백엔드 리소스가 아니라 공유 모델에서 파생된 SPA 라우트다.

## 현재 런타임 API

| 메서드 | 엔드포인트 | 용도 |
| --- | --- | --- |
| `GET` | `/api/wiki-pages` | Confluence 기반 위키 레코드를 `{ pages }` 형태로 반환 (SPA·서버리스 프록시 공용) |
| `POST` | `/api/wiki/ai/ask` | 읽기 전용 페이지 범위 AI 답변 |
| `POST` | `/api/wiki/ai/search` | 읽기 전용 검색 범위 AI 답변 |
| `GET` | `/api/github/projects` | GitHub 조직 프로젝트 목록을 `{ projects }` 형태로 반환 |

Confluence `policy` docType 페이지는 두 AI 엔드포인트의 숨김 답변 생성 컨텍스트로 사용된다. 공개 검색 결과나 추천 페이지에는 노출하지 않으며, 정책이 답변에 실질적으로 영향을 줄 때는 응답의 `policyNotice`에 명시한다.

`ops` docType 페이지는 공개 위키 레코드에서 제외하며, 현재 AI 프롬프트 컨텍스트에도 포함하지 않는다.

## 운영자 API

설계 목표 항목으로, MVP 우선 구현 대상이 아니다.

| 메서드 | 엔드포인트 | 용도 |
| --- | --- | --- |
| `GET` | `/api/ops/wiki/metadata/issues` | 누락·잘못된 메타데이터 조회 |
| `POST` | `/api/ops/wiki/ai/metadata-suggestions` | 메타데이터 제안 생성 |
| `POST` | `/api/ops/wiki/ai/relationship-suggestions` | 그래프 관계 제안 생성 |
| `GET` | `/api/ops/wiki/recompile-candidates` | 오래되거나 약한 문서 탐지 |
| `POST` | `/api/ops/wiki/cache/refresh` | 파생 캐시 갱신 |

## 파생 라우트 모델

Home, 카테고리, 아티클, 검색 뷰는 SPA 내부에서 공유 위키 문서 모델로 렌더링된다. 나중에 이 뷰를 위한 백엔드 엔드포인트가 추가된다면, 원시 Confluence 페이로드가 아닌 정규화된 뷰 모델을 반환해야 한다.

## AI Ask 계약

### 요청

```json
{
  "pageId": "63504385",
  "question": "이 문서 기준으로 먼저 무엇을 해야 하나요?",
  "history": [
    { "question": "이전 질문", "answer": "이전 답변" }
  ]
}
```

`history`는 이전 대화 턴 배열이다. 빈 배열(`[]`)로 생략 가능하다.

### 응답

```json
{
  "answer": "먼저 문서의 목적과 다음 단계 링크를 확인하세요.",
  "supportedByContext": true,
  "policyNotice": {
    "isPolicyRelated": false,
    "message": ""
  },
  "confluenceData": [
    {
      "pageId": "63504385",
      "title": "문서 제목",
      "quote": "답변을 뒷받침하는 짧은 근거"
    }
  ],
  "unsupportedClaims": [],
  "suggestedNextPages": [
    {
      "pageId": "63504386",
      "title": "다음 문서",
      "reason": "이어 읽으면 좋은 이유"
    }
  ]
}
```

## AI Search 계약

### 요청

```json
{
  "question": "윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?",
  "history": [
    { "question": "이전 질문", "answer": "이전 답변" }
  ]
}
```

`history`는 최근 3턴까지 유효하다. 빈 배열(`[]`)로 생략 가능하다.

### 응답

AI 원시 출력의 `recommendedPages`는 서버에서 변환되어 클라이언트에 전달되지 않는다. 대신 다음 두 필드로 분리된다.

- `recommendedDocuments`: AI가 직접 선택한 페이지 (없으면 랭킹 상위로 보완), 최대 4개
- `relatedDocuments`: 랭킹 기반 후보 중 `recommendedDocuments`에 없는 것, 최대 4개

```json
{
  "answer": "검색 결과를 바탕으로 한 자연어 답변",
  "policyNotice": {
    "isPolicyRelated": true,
    "message": "이 답변에는 내부 정책 기준이 함께 반영되어 있습니다."
  },
  "immediateActions": [
    {
      "text": "먼저 선행 설치 상태를 확인합니다.",
      "relatedPageIds": ["63504385"]
    }
  ],
  "exampleCommands": [
    "npm install -g @anthropic-ai/claude-code"
  ],
  "verificationChecks": [
    {
      "text": "설치 후 명령이 정상 동작하는지 확인했습니다.",
      "relatedPageIds": ["63504385"]
    }
  ],
  "cautions": [
    {
      "text": "Windows에서는 WSL 또는 Git for Windows가 더 안정적일 수 있습니다.",
      "relatedPageIds": ["63504385"]
    }
  ],
  "confluenceData": [
    {
      "pageId": "63504385",
      "title": "문서 제목",
      "quote": "답변을 뒷받침하는 짧은 근거"
    }
  ],
  "unsupportedClaims": [],
  "recommendedDocuments": [
    {
      "id": "63504385",
      "title": "추천 문서",
      "summary": "문서 요약",
      "href": "/guides/guide-slug"
    }
  ],
  "relatedDocuments": [
    {
      "id": "63504386",
      "title": "관련 문서",
      "summary": "문서 요약",
      "href": "/guides/related-slug"
    }
  ]
}
```

`concept` 질문에는 `immediateActions`, `exampleCommands`, `verificationChecks`, `cautions` 배열이 항상 비어 있다. AI가 채워도 서버에서 강제로 빈 배열로 대체한다.

## 오류 계약

```json
{
  "message": "Page not found",
  "code": "PAGE_NOT_FOUND",
  "details": {}
}
```

지원 오류 코드:

| 코드 | 의미 |
| --- | --- |
| `PAGE_NOT_FOUND` | 요청한 페이지 ID가 존재하지 않음 |
| `BAD_REQUEST` | 필수 요청 필드 누락 |
| `METHOD_NOT_ALLOWED` | 허용되지 않은 HTTP 메서드 |
| `CONFLUENCE_UNAVAILABLE` | Confluence 환경 설정 누락 또는 응답 오류 |
| `WIKI_SOURCE_NOT_CONFIGURED` | 서버리스 핸들러의 Confluence 환경 변수 누락 |
| `WIKI_SOURCE_UNAVAILABLE` | 서버리스 핸들러의 Confluence 응답 오류 |
| `AI_PROVIDER_UNAVAILABLE` | OpenAI 환경 설정 누락 또는 응답 오류 |
