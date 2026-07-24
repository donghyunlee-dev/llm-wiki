# edge-sidebar-fixes Test Result

## 실행 명령 및 결과

| 명령 | 결과 |
|---|---|
| `pnpm --filter @sfood/wiki-core test -- --run confluenceCleanHtml` | PASS (6/6) |
| `pnpm --filter @sfood/edge-sidebar test -- --run wikiClient` | PASS (wikiClient 11 + background 10 = 21) |
| `pnpm test` (전체) | PASS — wiki-core 164, web 52, edge-sidebar 21, mcp-server 36, serverless 5 (합계 278) |
| `pnpm typecheck` (전체) | PASS — 모든 패키지 Done |
| `pnpm --filter @sfood/edge-sidebar build` | PASS (Vite 번들, CSS 포함) |

## Acceptance Criteria 커버리지

| AC | 내용 | 검증 |
|---|---|---|
| AC1 | 매크로별 시맨틱 HTML 변환 + plain/rich 이중 노출 제거 | confluenceCleanHtml.test.ts (code/callout 텍스트 1회) ✅ |
| AC2 | 잔여 `ac:`/`ri:` 태그·`wiki.metadata` 제거 | confluenceCleanHtml.test.ts ✅ |
| AC3 | `/api/wiki/documents`가 정리된 contentHtml + related 반환 | 코드/typecheck ✅ (라이브 curl은 Confluence env 필요 — 아래 한계) |
| AC4 | 동일 페이지 참고 문서 중복 제거(제목 상이해도 1건) | wikiClient.test.ts (id 기준 dedup, trim 이후 상이 제목) ✅ |
| AC5 | guides/faq/library slug 링크 정상 해석 | wikiClient.test.ts (findCleanDocumentByHref slug/id) ✅ |
| AC6 | 콜아웃/코드 텍스트 다크·라이트 전경색 적용 | styles.css `var(--page-fg)` + build ✅ |
| AC7 | 전체 test/typecheck 통과(웹 회귀 없음) | `pnpm test`/`pnpm typecheck` ✅ |

## 리뷰 (spec-driven-workflow 6b/6c)
- **Codex 비판 리뷰 (6c)**: 실행함 — 결과는 result.md 참조.
- **Playwright (6b)**: MCP Playwright 브라우저에는 unpacked 익스텐션이 로드되지 않아 익스텐션 UI 직접 시각 검증 불가(이전 세션과 동일 한계). 웹 `/api/wiki/documents` 라이브 검증은 로컬 Confluence 자격증명이 있어야 가능.

## 건너뛴 검사 / 한계
- 라이브 `/api/wiki/documents` end-to-end 및 익스텐션 실사용(참고 문서 중복 없음, 링크 열림, 다크모드 가시성)은 **사용자 브라우저에서 수동 확인 필요**.
- 정규식 정리 함수는 깊은 중첩 매크로에서 웹앱 DOMParser 렌더러보다 견고성이 낮음(코드 품질 리뷰 minor). 텍스트 유실 없이 이중 노출만 방지하는 수준.
