# @sfood/mcp-server

사내 Confluence 위키를 **읽기 전용 MCP(Model Context Protocol) 서버**로 노출하는 독립 앱입니다.
Teams 봇·Slack 봇·사내 앱·AI 에이전트가 Confluence 계정 없이, **MCP API Key 하나로** 위키를 조회할 수 있습니다.

## 격리 원칙

- 이 앱은 `apps/web`, `apps/edge-sidebar`, `packages/wiki-core`, `packages/serverless`와 **파일 의존성이 없습니다.**
- `@sfood/wiki-core`를 import하지 않고, 자체 Confluence 클라이언트(`src/confluence.ts`)를 사용합니다.
- 런타임 npm 의존성이 **0개**입니다 (Node 22 글로벌 `fetch`/`btoa` 사용).
- 빌드·배포는 위키 서비스와 완전히 독립적으로 진행됩니다.

## 제공 도구 (read-only)

| Tool | 인자 | 설명 |
|---|---|---|
| `search_wiki` | `query`, `limit?`, `space_key?` | CQL 키워드 검색 → `{id, title, excerpt, url}[]` |
| `get_page` | `page_id` | 페이지 본문 plain text (최대 8,000자) |
| `get_page_by_title` | `title`, `space_key?` | 제목 일치 페이지 본문 |
| `get_page_children` | `page_id` | 직계 하위 페이지 목록 |
| `get_space_list` | (없음) | 접근 가능한 스페이스 목록 |

## 환경변수

| 변수명 | 필수 | 설명 |
|---|---|---|
| `ATLASSIAN_SITE_NAME` | ✅ | Confluence 사이트명 (예: `sfoodxproject`) |
| `ATLASSIAN_USER_EMAIL` | ✅ | 서비스 계정 이메일 |
| `ATLASSIAN_API_TOKEN` | ✅ | 서비스 계정 API 토큰 |
| `CONFLUENCE_SPACE_ID` | ✅ | 기본 검색 스페이스 **숫자 ID** (예: `63111172`) |
| `MCP_API_KEY` | ✅ | 클라이언트 인증용 API Key |
| `MCP_ALLOWED_ORIGIN` | ⬜ | CORS 허용 origin (기본 `*`) |

## 로컬 개발

```bash
pnpm install
pnpm --filter @sfood/mcp-server typecheck
pnpm --filter @sfood/mcp-server test
pnpm --filter @sfood/mcp-server build   # dist/index.mjs (Lambda 배포 아티팩트)
```

## 프로토콜

- Transport: MCP Streamable HTTP (JSON-RPC 2.0, `POST` 단일 엔드포인트)
- protocolVersion: `2024-11-05`
- 지원 메서드: `initialize`, `ping`, `tools/list`, `tools/call`, `notifications/*`
- 인증: `x-api-key` 헤더 (불일치/누락 → 401)
- Confluence 실패·404는 서버 크래시 없이 tool 결과의 `isError: true`로 반환

## 호출 예시

```bash
ENDPOINT="https://<function-url>.lambda-url.<region>.on.aws/"

# 1) 초기화
curl -s "$ENDPOINT" -H "content-type: application/json" -H "x-api-key: $MCP_API_KEY" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'

# 2) 도구 목록
curl -s "$ENDPOINT" -H "content-type: application/json" -H "x-api-key: $MCP_API_KEY" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 3) 위키 검색
curl -s "$ENDPOINT" -H "content-type: application/json" -H "x-api-key: $MCP_API_KEY" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call",
       "params":{"name":"search_wiki","arguments":{"query":"반품 규정","limit":5}}}'
```

## AWS 배포

단계별 배포 절차는 [`docs/tasks/wiki-mcp-server/aws-deployment-guide.md`](../../docs/tasks/wiki-mcp-server/aws-deployment-guide.md)를 참고하세요.
