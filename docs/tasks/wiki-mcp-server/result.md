# wiki-mcp-server Result

## 전달 범위 요약

사내 Confluence 위키를 **읽기 전용 MCP 서버**로 노출하는 격리된 앱 `apps/mcp-server`를 신규 구현했다.
서비스 계정 자격증명은 Lambda 환경변수에만 두고, 클라이언트는 `x-api-key` 하나로 위키를 조회한다.

### 산출물

- `apps/mcp-server/` — 독립 앱 패키지 (런타임 의존성 0개, Node 22 글로벌 `fetch` 사용)
  - `src/confluence.ts` — 자체 Confluence REST 클라이언트 (search/getPage/findByTitle/listChildren/listSpaces)
  - `src/auth.ts` — `x-api-key` 인증 (length-independent 비교)
  - `src/mcpHandler.ts` — MCP JSON-RPC 2.0 라우팅 (initialize/ping/tools.list/tools.call/notifications)
  - `src/tools/` — MCP tool 5개 + registry/dispatch
  - `src/index.ts` — Lambda Function URL 핸들러 (`export const handler`)
  - 테스트 4파일 / 36 케이스
  - `README.md`
- `docs/tasks/wiki-mcp-server/aws-deployment-guide.md` — AWS Lambda 배포 단계별 가이드

### MCP Tools

| Tool | 반환 |
|---|---|
| `search_wiki(query, limit?, space_key?)` | `{count, results:[{id,title,excerpt,url}]}` |
| `get_page(page_id)` | `{id,title,url,text}` (plain text, 8000자 트림) |
| `get_page_by_title(title, space_key?)` | `{found, page}` |
| `get_page_children(page_id)` | `{count, children:[{id,title,url}]}` |
| `get_space_list()` | `{count, spaces:[{id,key,name}]}` |

## 주요 결정

- **위치/격리 (사용자 핵심 요구)**: `packages/`가 아닌 `apps/mcp-server`(사이드바와 동일 레벨). `@sfood/wiki-core` 등 워크스페이스 패키지를 import하지 않고 Confluence 클라이언트를 자체 보유 → wiki/sidebar와 코드 의존성 0. 기존 패키지 소스 무수정. 환경(pnpm workspace)만 공유, 배포 독립.
- **MCP SDK 미사용**: 격리·무상태 Lambda 단순성을 위해 JSON-RPC 2.0을 직접 구현 (런타임 의존성 0개 유지).
- **Space ID 숫자**: CQL `space="{숫자ID}"` 사용 (Confluence 기본). 선택적 `space_key`로 오버라이드.
- **보안 하드닝(Codex 리뷰 반영)**: 동일 origin 페이지네이션만 추적(SSRF 방지), 페이지네이션 상한, malformed 입력 무크래시(-32700/-32600), HTML 비노출(plain text만).

## 검증

`test-result.md` 참고. 요약: 전체 `pnpm typecheck`/`pnpm test` 통과, 다른 서비스 회귀 없음, 격리 grep 0건, 번들 18.5kb 단일 ESM, Codex 리뷰 6/7 반영.

## 실제 배포 및 실제 Confluence 검증 (2026-07-30)

`sfood-ax-wiki-mcp` Lambda로 실제 배포하고 실제 Confluence 데이터로 5개 도구를 전부 검증했다 (`test-result.md` 참고).

- 검증 과정에서 `search_wiki`/`get_page_by_title`이 프로덕션에서 항상 실패하는 버그, `get_page` URL이 깨지는 버그를 발견해 수정했다.
- 근본 원인: v1 CQL `content/search`의 `space=` 필드는 스페이스 키를 요구하는데 숫자 `CONFLUENCE_SPACE_ID`를 그대로 넣고 있었다. `packages/wiki-core`가 쓰는 v2 API(`space-id` 숫자 파라미터)로 전환해 v1 CQL 코드를 전부 제거했다.
- 재배포 후 실제 문서로 재검증 완료.

## 남은 갭 / 후속

- **Function URL(퍼블릭 엔드포인트) 미생성**: 보안상 아직 열지 않음. 필요 시 별도 승인 후 진행.
- `search_wiki`는 스페이스 내 모든 페이지를 가져와 로컬에서 텍스트 매칭한다 (Confluence 자체 검색엔진의 관련도 랭킹은 없음) — `packages/wiki-core`의 기존 방식과 동일한 트레이드오프.
- 응답 캐싱, 사용자별 권한 분리는 spec상 out-of-scope.
