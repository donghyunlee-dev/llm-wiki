# wiki-mcp-server Plan

## Impacted Areas

| 파일/경로 | 변경 종류 | 내용 |
|---|---|---|
| `apps/mcp-server/` | 신규 | 격리된 앱 패키지 전체 (런타임 의존성 0개) |
| `pnpm-workspace.yaml` | 무변경 | 이미 `apps/*` 포함 → 자동 인식 |
| `packages/wiki-core/**` | **무변경** | 격리 제약 — import·수정 금지 |
| `apps/web/**`, `apps/edge-sidebar/**`, `packages/serverless/**` | **무변경** | 격리 제약 |
| `pnpm-lock.yaml` | 부수 변경 | 신규 devDependency 링크로만 갱신 (다른 서비스 영향 없음) |

격리 검증: 구현 후 `grep -r "@sfood/" apps/mcp-server/src`가 0건이어야 한다.

## Approach

### 단계 1 — `apps/mcp-server` 패키지 스캐폴드

```
apps/mcp-server/
├── src/
│   ├── index.ts              ← Lambda handler export (Function URL 이벤트 처리)
│   ├── mcpHandler.ts         ← MCP JSON-RPC 2.0 라우팅
│   ├── auth.ts               ← API Key 검증 (x-api-key 헤더)
│   ├── confluence.ts         ← 자체 Confluence REST 클라이언트 (wiki-core 미사용)
│   ├── confluence.test.ts
│   ├── auth.test.ts
│   ├── tools.test.ts
│   ├── handler.test.ts
│   └── tools/
│       ├── index.ts          ← tool registry (정의 + dispatch)
│       ├── searchWiki.ts
│       ├── getPage.ts
│       ├── getPageByTitle.ts
│       ├── getPageChildren.ts
│       └── getSpaceList.ts
├── package.json
├── tsconfig.json
└── README.md
```

**package.json** (런타임 deps 0, devDeps만)
```json
{
  "name": "@sfood/mcp-server",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=node --target=node22 --format=esm --outfile=dist/index.mjs",
    "test": "vitest run",
    "typecheck": "tsc -p tsconfig.json"
  },
  "devDependencies": { "esbuild": "^0.27.0", "typescript": "^5.9.0", "vitest": "^3.2.0" }
}
```

### 단계 2 — 자체 Confluence 클라이언트 (`src/confluence.ts`)

기존 `confluenceClient.ts`의 *형태*를 참고하되 코드 의존 없이 새로 작성한다.
- `createConfluenceRequest(config)` — Basic 인증 GET, 실패 시 `ConfluenceHttpError(status)` throw
- `searchConfluencePages` — `GET /wiki/rest/api/content/search?cql=text~"q" AND space="{id}"&limit=n`, `{id,title,excerpt,url}[]`
- `getConfluencePage` — `GET /wiki/api/v2/pages/{id}?body-format=storage` → storage HTML을 plain text로 변환(최대 8,000자), `{id,title,url,text}`
- `findConfluencePageByTitle` — `cql=title="{title}" [AND space="{id}"]` → 첫 매치 id 해석 후 `getConfluencePage`로 본문 포함 반환
- `listConfluenceChildPages` — `GET /wiki/api/v2/pages/{parentId}/children?limit=50` 페이지네이션, `{id,title,url}[]`
- `listConfluenceSpaces` — `GET /wiki/api/v2/spaces?limit=50&status=current`, `{id,key,name}[]`

CQL `space` 필드에는 환경변수 숫자 Space ID를 그대로 사용한다 (Confluence 기본).

### 단계 3 — MCP 프로토콜 (JSON-RPC 2.0, `src/mcpHandler.ts`)

지원 메서드:
- `initialize` → `{ protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo }`
- `ping` → `{}`
- `tools/list` → 5개 tool 정의
- `tools/call` → tool dispatch → `{ content: [{type:"text",text}], isError? }`
- `notifications/*` → 응답 없음 (null)
- 미지원 메서드 → JSON-RPC error `-32601`

**Tool 반환 형식**
```ts
// 성공: { content: [{ type: "text", text: JSON.stringify(result) }] }
// 실패: { content: [{ type: "text", text: errorMessage }], isError: true }
```
Confluence 실패·404는 JSON-RPC 에러가 아니라 `isError: true` tool 결과로 반환 (서버 크래시 없음).

### 단계 4 — Lambda handler (`src/index.ts`)

- Function URL v2.0 / v1 이벤트 모두에서 method·headers·body 추출
- `OPTIONS` → 204 CORS, `POST` 외 → 405
- `x-api-key` 검증 (`auth.ts`) → 실패 시 401, 미설정 시 500
- body JSON 파싱 → JSON-RPC 단건/배치 처리
  - notification만 있으면 202 Accepted (본문 없음)
  - 그 외 200 + JSON-RPC 응답
- JSON 파싱 실패 → JSON-RPC `-32700`
- CORS 헤더: origin = `MCP_ALLOWED_ORIGIN || "*"`, allow-headers `content-type, x-api-key, mcp-session-id, mcp-protocol-version`

### 단계 5 — 환경변수

| 변수명 | 설명 |
|---|---|
| `ATLASSIAN_SITE_NAME` | Confluence 사이트명 (예: sfoodxproject) |
| `ATLASSIAN_USER_EMAIL` | 서비스 계정 이메일 |
| `ATLASSIAN_API_TOKEN` | 서비스 계정 API 토큰 |
| `CONFLUENCE_SPACE_ID` | 기본 검색 대상 스페이스 숫자 ID |
| `MCP_API_KEY` | 클라이언트 인증용 API Key |
| `MCP_ALLOWED_ORIGIN` | (선택) CORS 허용 origin, 기본 `*` |

### 단계 6 — 문서

- `apps/mcp-server/README.md` — 개요, env, 로컬 실행/테스트, MCP 요청 예시
- `docs/tasks/wiki-mcp-server/aws-deployment-guide.md` — esbuild 번들 → Lambda(Node22) → Function URL → 환경변수 → 호출 검증 단계별 가이드

## Validation Plan

1. `pnpm --filter @sfood/mcp-server typecheck` — 타입 에러 없음
2. `pnpm --filter @sfood/mcp-server test` — confluence/auth/tools/handler 유닛·통합 테스트 (mock fetch)
3. `pnpm typecheck && pnpm test` — 전체 워크스페이스 회귀 (다른 서비스 영향 없음 확인)
4. 격리 검증 — `grep -r "@sfood/" apps/mcp-server/src` 0건
5. (수동) 실제 Confluence·배포 후 end-to-end — 배포 가이드 절차

## Risks

| 리스크 | 가능성 | 대응 |
|---|---|---|
| CQL `space` 숫자 ID 미스매치 | 낮음 | 운영자 확인 — Confluence 기본이 숫자 ID. 0건 시 가이드에서 키 대체 옵션 안내 |
| `content/search` excerpt 미포함 | 중간 | 없으면 빈 문자열, title/url로 충분히 식별 가능 |
| Lambda ESM 핸들러 export 형식 | 낮음 | esbuild `--format=esm`, `export const handler` 표준 패턴 |
| Lambda cold start 지연 | 낮음 | 사내 내부 트래픽 허용 범위 |
