# wiki-mcp-server Tasks

> 격리 제약 반영으로 재정렬됨 (2026-06-18): `apps/mcp-server` 독립 앱, wiki-core 미사용.
> 이전 I1~I4(wiki-core 수정)는 격리 제약과 충돌하여 제거됨.

## Implementation Tasks

- [x] I1: `apps/mcp-server` 스캐폴드 — `package.json`, `tsconfig.json`
- [x] I2: `src/confluence.ts` — 자체 Confluence REST 클라이언트 5개 함수
- [x] I3: `src/auth.ts` — `x-api-key` API Key 검증
- [x] I4: `src/tools/*.ts` + `src/tools/index.ts` — MCP tool 5개 + registry/dispatch
- [x] I5: `src/mcpHandler.ts` — MCP JSON-RPC 2.0 라우팅
- [x] I6: `src/index.ts` — Lambda Function URL handler export

## Test Tasks

- [x] T1: `confluence.test.ts` — search/getPage/findByTitle/listChildren/listSpaces (mock fetch, 404, SSRF 방지 포함)
- [x] T2: `auth.test.ts` — 유효/무효/누락 API Key, 미설정
- [x] T3: `tools.test.ts` — 5개 tool 성공·에러 케이스
- [x] T4: `handler.test.ts` — initialize / tools/list / tools/call / 401 / notification 202 / 엣지케이스

## Documentation Tasks

- [x] D1: `apps/mcp-server/README.md` — 개요, 환경변수, 로컬 실행, 사용 예시
- [x] D2: `docs/tasks/wiki-mcp-server/aws-deployment-guide.md` — AWS Lambda 배포 가이드
- [x] D3: `docs/tasks/wiki-mcp-server/result.md` 작성

## Verification

- [x] V1: 격리 검증 — `grep` 0건, 기존 패키지 무수정
- [x] V2: `pnpm typecheck` 전체 통과
- [x] V3: `pnpm test` 전체 통과 (회귀 없음)
- [x] V4: Codex 비판 리뷰 6/7 반영 (test-result.md)
