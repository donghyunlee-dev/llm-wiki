# API Spec

## API Direction
The API must serve normalized wiki experiences, not raw Confluence payloads. Public responses must already enforce visibility filtering and sanitized content rendering.

## Public APIs
| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/wiki/home` | Home sections, featured guides, featured projects, search preview |
| `GET` | `/api/wiki/categories/{slug}` | Category overview and visible article list |
| `GET` | `/api/wiki/pages/{pageId}` | Article detail with normalized content |
| `GET` | `/api/wiki/pages/{pageId}/graph` | Prerequisites, next, related, parent links |
| `GET` | `/api/wiki/search?q=` | Search visible published documents |
| `POST` | `/api/wiki/ai/ask` | Read-only page-scoped AI answer |
| `POST` | `/api/wiki/ai/search` | Read-only search-scoped AI answer from visible Confluence results |

## Operator APIs
These are design targets, not MVP-first implementation requirements.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/ops/wiki/metadata/issues` | Missing or invalid metadata |
| `POST` | `/api/ops/wiki/ai/metadata-suggestions` | Generate metadata suggestions |
| `POST` | `/api/ops/wiki/ai/relationship-suggestions` | Generate graph suggestions |
| `GET` | `/api/ops/wiki/recompile-candidates` | Detect stale or weak docs |
| `POST` | `/api/ops/wiki/cache/refresh` | Refresh derived caches |

## Home Response Shape
```json
{
  "hero": {
    "title": "사내 지식 위키",
    "subtitle": "사내 지식을 쉽게 찾아보세요"
  },
  "entryCards": [
    { "slug": "guides", "title": "시작 가이드", "description": "처음이라면 여기서 시작하세요." }
  ],
  "featuredGuides": [],
  "featuredProjects": [],
  "themeOptions": ["light", "dark", "system"]
}
```

## Page Detail Response Shape
```json
{
  "article": {
    "id": "63504385",
    "title": "문서 제목",
    "summary": "요약",
    "category": "guides",
    "updatedAt": "2026-04-28",
    "sourceUrl": "https://.../wiki/...",
    "contentHtml": "<h1>...</h1>",
    "metadata": {
      "docType": "overview",
      "visibility": "public",
      "audience": "intermediate",
      "status": "published",
      "prerequisites": [],
      "next": [],
      "related": []
    },
    "headings": [],
    "breadcrumbs": [],
    "graph": {
      "prerequisites": [],
      "next": [],
      "related": [],
      "parent": null
    }
  }
}
```

## AI Ask Contract
Request:
```json
{
  "pageId": "63504385",
  "question": "이 문서 기준으로 먼저 무엇을 해야 하나요?",
  "history": []
}
```

## AI Search Contract
Request:
```json
{
  "question": "윈도우에서 gpt에 파일 시스템 mcp 어떻게 설정해?"
}
```

Response:
```json
{
  "answer": "검색 결과를 바탕으로 한 자연어 답변",
  "confluenceData": [
    {
      "pageId": "63504385",
      "title": "문서 제목",
      "quote": "답변을 뒷받침하는 짧은 근거"
    }
  ],
  "unsupportedClaims": [],
  "recommendedPages": [
    {
      "pageId": "63504385",
      "title": "추천 문서",
      "reason": "추천 이유"
    }
  ],
  "recommendedDocuments": [
    {
      "id": "63504385",
      "title": "추천 문서",
      "summary": "짧은 요약",
      "href": "/guides/..."
    }
  ],
  "guideDocuments": []
}
```

Response:
```json
{
  "answer": "먼저 문서의 목적과 다음 단계 링크를 확인하세요.",
  "supportedByContext": true,
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

## Error Contract
```json
{
  "message": "Page not found",
  "code": "PAGE_NOT_FOUND",
  "details": {}
}
```

Supported error codes:
- `PAGE_NOT_FOUND`
- `OUTSIDE_SPACE`
- `METADATA_INVALID`
- `FORBIDDEN`
- `CONFLUENCE_UNAVAILABLE`
- `AI_PROVIDER_UNAVAILABLE`
