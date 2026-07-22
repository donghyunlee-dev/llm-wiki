# edge-sidebar-fixes Tasks

구현 계획 상세: `docs/superpowers/plans/2026-07-22-edge-sidebar-fixes.md`

| # | 작업 | 상태 | 커밋 |
|---|---|---|---|
| 1 | `wiki-core` DOM-비의존 매크로 정리 함수 `renderConfluenceContentToCleanHtml` + 단위 테스트 | 완료 | 60dc4b6 |
| 2 | 웹 dev 서버 `GET /api/wiki/documents` 엔드포인트 | 완료 | fc7cb12 |
| 3 | 익스텐션 검색 소스 dedup을 페이지 ID 기준으로, href 우선순위(guides/faq/library) 수정 | 완료 | ee44d29 |
| 3b | dedup 회귀 테스트 강화(trim 이후에도 다른 제목, library 케이스 추가) | 완료 | a64afd7 |
| 4 | 익스텐션 가이드 본문을 `/api/wiki/documents`에서 로드 + storage-format 죽은 코드 제거 | 완료 | 02ed86f |
| 5 | 익스텐션 `.wiki-callout`/코드 테마 스타일 | 완료 | 10f29ed |
| 6 | 전체 검증(test/typecheck), Codex 리뷰, 문서화 | 진행 중 | — |

## 리뷰 게이트
- Task 1~4: 스펙 준수 리뷰 ✅ + 코드 품질 리뷰 ✅ (서브에이전트 2단계)
- Task 5: CSS 추가 — diff 직접 검증 ✅
