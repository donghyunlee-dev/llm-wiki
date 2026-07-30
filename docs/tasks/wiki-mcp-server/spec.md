# wiki-mcp-server Spec

## Problem Statement

- 사내 Confluence에는 규정, 매뉴얼, 운영 지침 등 중요한 지식이 저장되어 있다.
- Confluence에 접근하려면 Atlassian 계정 또는 API 토큰이 필요하다.
- Teams 봇, Slack 봇, 사내 커스텀 앱, AI 에이전트 등 외부 서비스는 Confluence 계정 없이 위키 데이터에 접근할 수 없다.
- 계정을 서비스마다 발급하면 자격증명 관리 비용이 증가하고 보안 리스크가 커진다.

## Business Context

- 예시: 영업팀이 규정·법률 정보가 필요한 앱을 만들 때, 사용자에게 Confluence 계정을 줄 수 없어 데이터 접근이 불가능하다.
- MCP(Model Context Protocol) 서버를 중간 계층으로 두면, 서비스 계정 1개의 자격증명으로 다수의 클라이언트에 읽기 전용 위키 접근을 제공할 수 있다.
- 자격증명은 MCP 서버(Lambda 환경변수)에만 저장되고, 클라이언트는 MCP API Key만으로 접근한다.
- Rovo API나 Atlassian Connect는 Atlassian 계정 보유자 전용이어서 이 목적에 맞지 않는다.

## Isolation Constraint (최우선 제약)

- `mcp-server`는 `apps/edge-sidebar`와 동일한 레벨의 **별도 앱 폴더** `apps/mcp-server`로 생성한다.
- 기존 위키 웹앱(`apps/web`), 사이드바(`apps/edge-sidebar`), 공유 코어(`packages/wiki-core`), 위키 Lambda(`packages/serverless`)와 **파일 의존성이 전혀 없어야 한다.**
  - `@sfood/wiki-core`를 import하지 않는다. Confluence 클라이언트 로직을 mcp-server 내부에 자체 보유한다.
  - 위 패키지들의 소스 코드를 수정하지 않는다.
- 환경(pnpm workspace, 동일 레포, env 규칙)은 공유하되 **빌드·배포는 완전히 독립**이다.
- 이 작업으로 인해 다른 서비스의 동작·빌드·배포가 영향받지 않아야 한다.

## Scope

- `apps/mcp-server` 신규 앱 패키지 생성 (TypeScript, 런타임 의존성 0개 — Node 글로벌 `fetch` 사용)
- AWS Lambda Function URL로 배포 (API Gateway 없음, 무료 티어 범위)
- MCP Streamable HTTP transport (JSON-RPC 2.0, protocolVersion `2024-11-05`) 직접 구현 (외부 SDK 미사용)
- 읽기 전용 MCP Tools 5개:
  1. `search_wiki(query, limit?)` — CQL 키워드로 페이지 검색
  2. `get_page(page_id)` — 페이지 ID로 본문 조회 (plain text 반환)
  3. `get_page_by_title(title, space_key?)` — 제목으로 페이지 조회
  4. `get_page_children(page_id)` — 하위 페이지 목록 조회
  5. `get_space_list()` — 접근 가능한 스페이스 목록 조회
- API Key 기반 클라이언트 인증 (`x-api-key` 헤더)
- mcp-server 내부 `src/confluence.ts`에 자체 Confluence REST 클라이언트 구현:
  - `searchConfluencePages(config, query, limit)` — v2 페이지 목록 + 로컬 텍스트 매칭 검색 (v1 CQL 미사용)
  - `getConfluencePage(config, pageId)` — 본문 plain text 조회
  - `findConfluencePageByTitle(config, title, spaceOverride?)` — v2 페이지 목록 + 로컬 정확 제목 매칭 (v1 CQL 미사용)
  - `listConfluenceChildPages(config, parentId)` — 하위 페이지 전체 목록
  - `listConfluenceSpaces(config)` — 스페이스 목록

## Out Of Scope

- 페이지 생성·수정·삭제 등 쓰기 작업
- 사용자별 권한 분리 (모든 클라이언트가 단일 서비스 계정으로 조회)
- 응답 캐싱 레이어 (초기 버전 제외)
- 시맨틱·벡터 검색
- Confluence 외 다른 위키 소스 연동
- MCP SSE streaming (요청-응답 방식으로 충분)
- Rovo, Atlassian Connect 연동

## User Or Operator Scenarios

### Scenario 1 — 영업팀 앱에서 규정 조회

영업팀 앱이 MCP 클라이언트로 `search_wiki("반품 규정")`을 호출한다.
서버가 Confluence CQL로 검색하고 제목·excerpt·URL이 담긴 페이지 목록을 반환한다.
앱이 원하는 페이지의 `get_page(page_id)`를 호출해 본문 plain text를 받아 사용자에게 표시한다.

### Scenario 2 — Teams 봇에서 가이드 내용 안내

Teams 봇이 사용자의 질문을 받아 `search_wiki("Claude Code 설치")`를 호출한다.
결과 중 관련성 높은 페이지를 `get_page`로 가져와 요약 후 답변한다.

### Scenario 3 — AI 에이전트가 하위 페이지 탐색

에이전트가 인덱스 페이지의 `get_page_children(page_id)`로 하위 페이지 목록을 얻고,
필요한 페이지를 `get_page`로 순서대로 조회해 지식을 수집한다.

## Acceptance Criteria

- AC1: `search_wiki` 호출 시 쿼리와 관련된 Confluence 페이지 목록을 반환한다 (id, title, excerpt, url 포함).
- AC2: `get_page` 호출 시 지정한 페이지의 본문이 plain text로 반환된다.
- AC3: `get_page_by_title` 호출 시 제목이 일치하는 페이지를 반환한다.
- AC4: `get_page_children` 호출 시 해당 페이지의 직계 하위 페이지 목록을 반환한다.
- AC5: `get_space_list` 호출 시 서비스 계정이 접근 가능한 스페이스 목록을 반환한다.
- AC6: 유효하지 않은 API Key 요청에 401을 반환한다.
- AC7: Lambda Function URL로 배포되어 HTTPS 엔드포인트로 호출 가능하다. (AWS 배포 가이드 문서 제공)
- AC8: `pnpm typecheck` 및 `pnpm test` 통과.
- AC9: `apps/mcp-server`가 `@sfood/wiki-core` 등 다른 워크스페이스 패키지를 import하지 않고, 기존 패키지 소스를 수정하지 않는다 (격리 검증).

## Edge Cases

- Confluence API 호출 실패 시 MCP 에러 응답 반환 (서버 크래시 없음).
- 존재하지 않는 페이지 ID로 `get_page` 호출 시 명확한 에러 메시지 반환 (404 not found).
- 검색 결과가 없을 때 빈 배열 반환 (에러 아님).
- API Key 헤더 없는 요청은 401 반환.
- 대용량 페이지 본문은 plain text 변환 후 최대 8,000자 트리밍.

## Assumptions

- 클라이언트(Teams, Slack, 앱, 에이전트)는 MCP Streamable HTTP transport를 지원한다.
- Confluence 서비스 계정은 이미 존재하며 API Token이 발급되어 있다.
- AWS Lambda 배포는 기존 `packages/serverless` 배포 *패턴*(Function URL, env 기반)을 코드 의존 없이 참고만 한다.
- MCP API Key는 운영자가 Lambda 환경변수로 설정한다.
- Lambda 런타임은 Node.js 22로 글로벌 `fetch`/`btoa`를 제공한다 (런타임 npm 의존성 0개).

## Clarifications

- Q: 검색 시 스페이스를 고정할지, 파라미터로 받을지?
- A: 기본값은 환경변수 `CONFLUENCE_SPACE_ID`로 고정. 선택적 `space_key` 파라미터로 오버라이드 가능.

- Q: `CONFLUENCE_SPACE_ID`는 숫자인가 키인가?
- A: Confluence 기본은 **숫자 ID**다.
- **정정 (2026-07-30, 실제 배포 테스트 중 발견)**: 최초 구현은 v1 CQL `content/search`의 `space="{id}"` 필드에 숫자 ID를 그대로 넣었으나, CQL의 `space` 필드는 스페이스 **키**를 요구해 항상 0건이 반환되는 버그였다. `packages/wiki-core`가 이미 쓰고 있는 v2 API(`/wiki/api/v2/pages?space-id={숫자ID}`)로 전환해 숫자 ID를 그대로 활용하도록 수정했다. `search_wiki`/`get_page_by_title` 모두 v1 CQL을 쓰지 않고 v2 페이지 목록 + 로컬 텍스트/제목 매칭으로 재구현했다.

- Q: `get_page` 반환값에 HTML 원본도 포함할지?
- A: 아니오. plain text만 반환. HTML 직접 노출은 보안 위험이 있어 제외.

- Q: MCP SDK를 쓸지, 직접 구현할지?
- A: **직접 구현**. 격리(런타임 의존성 0개)와 Lambda 무상태 요청-응답 단순성을 위해 JSON-RPC 2.0을 직접 구현한다. 외부 SDK 미사용.

- Q: mcp-server 위치는?
- A: `apps/mcp-server` (사이드바와 동일 레벨). `packages/`가 아니다. → Isolation Constraint 참고.
