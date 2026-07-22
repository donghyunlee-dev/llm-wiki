# edge-sidebar-fixes Result

## 전달 범위 요약
익스텐션(`apps/edge-sidebar`)의 3대 오동작을 A안(서버 정리 HTML)으로 해결했다. 익스텐션은 웹앱의 정규화 결과를 서버 엔드포인트로 받아 렌더만 하며, 0-의존 격리를 유지한다.

## 커밋 (branch `fix/edge-sidebar-fixes`)
- `60dc4b6` wiki-core DOM-비의존 매크로 정리 함수 `renderConfluenceContentToCleanHtml`
- `fc7cb12` 웹 dev 서버 `GET /api/wiki/documents` 엔드포인트
- `ee44d29` 익스텐션 검색 소스 dedup을 페이지 ID 기준으로, href 우선순위(guides/faq/library)
- `a64afd7` dedup 회귀 테스트 강화
- `02ed86f` 익스텐션 가이드 본문을 정리 엔드포인트에서 로드 + storage-format 죽은 코드 제거
- `10f29ed` 익스텐션 콜아웃/코드 테마 스타일
- `ce5fa0d` (Codex High 반영) sanitizer가 따옴표 없는 이벤트 핸들러도 제거

## 문제별 해결
1. **가이드 본문 이중 노출 + 불가시**: 서버가 매크로를 시맨틱 HTML로 정리해 반환 → plain/rich 이중 노출 제거. `.wiki-callout`/코드에 `var(--page-fg)` 테마 스타일 적용 → 다크모드 가시성 확보.
2. **추천/참고 페이지 중복**: dedup 기준을 제목 → 페이지 ID로 변경(제목이 AI 생성으로 달라도 동일 페이지는 1건).
3. **추천 페이지 링크 오동작**: `isSpecificDocumentHref`를 guides/faq/library로 확장해 안정적인 slug 링크가 불안정한 `/wiki/{pageId}`보다 우선. 가이드 본문은 id/slug 양쪽으로 해석되는 정리 엔드포인트에서 로드.

## 검증
- `pnpm test` 279개 통과(wiki-core 165, web 52, edge-sidebar 21, mcp-server 36, serverless 5), `pnpm typecheck` 전체 통과, 익스텐션 build 통과.
- 서브에이전트 2단계 리뷰(스펙 준수 + 코드 품질)를 Task 1~4에 적용, Task 5(CSS)는 diff 직접 검증.
- Codex 비판 리뷰: Critical 0건. High 1건(XSS) 반영 완료. Medium/Low는 기존 웹 동작과 일치하거나 문서화된 정규식 한계로 판단.

## 남은 갭 / 결정
- **정규식 정리기 한계**: 깊은 중첩 매크로(콜아웃 안 콜아웃), 코드 CDATA에 `</ac:structured-macro>` 리터럴 포함 시 완전 견고하지 않음. 텍스트 유실 없이 이중 노출만 방지. 웹앱 본체는 기존 DOMParser 렌더러 유지(의도적 이원화).
- **섹션 간 slug 충돌**: 서로 다른 섹션의 두 문서가 같은 slug면 먼저 나온 문서가 열릴 수 있음(앱 전반의 기존 동작, 이번 범위 밖).
- **수동 검증 필요**: 라이브 `/api/wiki/documents` end-to-end와 익스텐션 실사용(참고 문서 중복 없음, 링크 열림, 다크모드 가시성)은 사용자 브라우저에서 unpacked 익스텐션 새로고침 후 확인 필요. MCP Playwright에는 익스텐션이 로드되지 않음.
- 프로덕션 serverless 엔드포인트(`/api/wiki/documents` 대응)는 미구현 — 익스텐션은 dev 기준. 필요 시 후속 태스크.
