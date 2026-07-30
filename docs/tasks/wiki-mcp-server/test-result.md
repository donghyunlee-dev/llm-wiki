# wiki-mcp-server Test Result

## 실행 환경
- 2026-06-18, Node v24 (로컬), Lambda 타깃 Node 22
- 신규 패키지: `apps/mcp-server` (격리, 런타임 의존성 0개)

## 실행 명령 및 결과

| 명령 | 결과 |
|---|---|
| `pnpm install` | ✅ 6 workspace projects, esbuild 스토어 재사용 |
| `pnpm --filter @sfood/mcp-server typecheck` | ✅ 통과 (tsc, 에러 0) |
| `pnpm --filter @sfood/mcp-server test` | ✅ 36 tests / 4 files 통과 |
| `pnpm --filter @sfood/mcp-server build` | ✅ `dist/index.mjs` 18.5kb 단일 ESM |
| `pnpm typecheck` (전체) | ✅ 6개 프로젝트 전부 통과 |
| `pnpm test` (전체) | ✅ wiki-core 158, serverless 5, web 52, mcp-server 36, edge-sidebar(0) — 회귀 없음 |
| `grep -rn "from \"@sfood" apps/mcp-server/src` | ✅ 0건 (격리 확인) |

## 테스트 커버리지 (36)

- `confluence.test.ts` (11): search 매핑/빈결과/space override, getPage plain text·8000자 트림·404(ConfluenceHttpError), findByTitle 정확매치/null, child 페이지네이션, **foreign-origin next 미추적(SSRF 방지)**, space 목록
- `auth.test.ts` (5): 일치, 헤더 대소문자, 불일치 401, 누락 401, 미설정 500
- `tools.test.ts` (6): tool 5개 노출, search 직렬화, 필수 인자 누락 isError, get_page 404 메시지, unknown tool, get_space_list 무인자
- `handler.test.ts` (14): initialize, tools/list(5), tools/call, 401(불일치/누락), notification 202, OPTIONS 204, GET 405, env 누락 500, parse error -32700, **id:null 응답**, **빈 배치 -32600**, **malformed shape -32600**, **malformed base64 무크래시**

## Codex 비판 리뷰 (6c)

Codex(gpt-5.2)로 `apps/mcp-server` 전체 critical 리뷰 수행. 7건 중 6건 반영, 1건 설계상 수용:

| # | 지적 | 처리 |
|---|---|---|
| 1 | `id: null`을 notification으로 오인 | ✅ notification = `id` 부재(`undefined`)로만 판정 |
| 2 | 빈 배치 `[]` → 202 | ✅ `-32600 Invalid Request`로 변경 |
| 3 | 요청 shape 미검증 | ✅ `jsonrpc!=="2.0"`/비문자 method → `-32600` |
| 4 | base64 디코딩이 try 밖 → 크래시 | ✅ 디코딩을 try 내부로 이동, `-32700` 반환 |
| 5 | 페이지네이션 무한루프 가능 | ✅ `MAX_PAGINATION_PAGES=50` 가드 |
| 6 | 와일드카드 CORS | ⚠️ 수용 — 클라이언트가 서버사이드(Teams/Slack/agent)이고 실제 게이트는 `x-api-key`. 기본 `*` 유지, README/spec에 명시 |
| 7 | 절대 `_links.next` SSRF | ✅ 동일 Atlassian origin 링크만 추적 |

리뷰 확인 항목: `id=0` 정상 처리, 런타임 의존성 격리 충족, tool 404/실패의 `isError` 변환 정상.

## Playwright 검증 (6b)

- **N/A — 영향받는 UI 경로 없음.** 본 작업은 백엔드 MCP Lambda 엔드포인트로 위키 웹앱/사이드바 UI를 변경하지 않음. UI 회귀는 `pnpm test`(web 52건 통과)로 커버.
- 실제 Confluence 연동 end-to-end 및 Function URL 검증은 `aws-deployment-guide.md` 5절(수동) 절차로 분리.

## Acceptance Criteria 커버리지

- AC1 search_wiki ✅ / AC2 get_page plain text ✅ / AC3 get_page_by_title ✅ / AC4 children ✅ / AC5 space_list ✅
- AC6 무효 API Key 401 ✅ / AC7 Function URL 배포 — 가이드 문서 제공(수동 배포 단계) / AC8 typecheck·test ✅ / AC9 격리 ✅

## 실제 AWS Lambda 배포 및 실제 Confluence 검증 (2026-07-30)

### 배포

- 신규 Lambda `sfood-ax-wiki-mcp` 생성 (기존 `sfood-ax-wiki-documents`의 실행 Role 재사용, 프로덕션 함수 무수정)
- Confluence 자격증명은 기존 `sfood-ax-wiki-documents`와 동일 값(콘솔에서 직접 이전), `MCP_API_KEY`/`MCP_ALLOWED_ORIGIN` 신규 설정
- Function URL(퍼블릭 엔드포인트)은 보안상 생성하지 않음 — `aws lambda invoke`로 직접 호출해 검증

### 실제 Confluence 데이터로 발견 및 수정한 버그 2건

| # | 증상 | 원인 | 수정 |
|---|---|---|---|
| 1 | `search_wiki`가 항상 `count: 0` | v1 CQL `content/search`의 `space="{숫자ID}"` 필드는 스페이스 **키**를 요구 — 숫자 ID로는 매칭 불가 | `packages/wiki-core`와 동일한 v2 API(`/wiki/api/v2/pages?space-id={숫자ID}`)로 전환, 로컬 텍스트 매칭으로 재구현 |
| 2 | `get_page`이 반환한 URL이 404 | `getConfluencePage`가 `/wiki` 베이스 없이 `siteBaseUrl`을 그대로 URL 조합에 사용 (search 경로는 `_links.base` 보정을 이미 하고 있어 비대칭) | `readLinkBase(response, siteBaseUrl)`로 통일 |
| 3 (연쇄) | `get_page_by_title`도 `found: false` | #1과 동일한 v1 CQL `space=` 버그 | `search_wiki`와 동일하게 v2 페이지 목록 + 로컬 정확 제목 매칭으로 재구현, v1 CQL 코드(`escapeCql` 포함) 전체 제거 |

TDD로 각 버그에 대해 실패하는 테스트를 먼저 작성 → RED 확인 → 최소 구현으로 GREEN 확인. 최종 유닛테스트 36 → **42개**로 증가, 전체 통과.

### 재배포 후 실제 Confluence 재검증

| 도구 | 실제 호출 결과 |
|---|---|
| `tools/list` | ✅ 5개 도구 노출 |
| 잘못된 API Key | ✅ 401 |
| `get_space_list` | ✅ 실제 스페이스 31개 (`AIAW`="AI Agent Wiki" 등) |
| `search_wiki` (기본 숫자 `CONFLUENCE_SPACE_ID`, override 없음) | ✅ 실제 문서 5건 검색 성공 (예: `[Guide] Index`, `[FAQ] Index`) |
| `get_page` | ✅ 본문 3,318자 추출, URL 302(정상) — 수정 전 404였음을 curl로 대조 확인 |
| `get_page_by_title` | ✅ `found: true`, 실제 페이지 반환 — 수정 전 `found: false`였음을 확인 |
| `get_page_children` | ✅ 정상 동작 (해당 페이지는 하위 없음 — 정상) |

**결론**: 최초 구현은 유닛테스트(mock 기반)로는 전부 통과했지만, 실제 Confluence 데이터로 검증한 결과 핵심 기능(`search_wiki`, `get_page_by_title`) 두 개가 프로덕션에서 항상 실패하는 상태였다. 실제 데이터 검증 후 모든 도구가 정상 동작함을 확인했다.
