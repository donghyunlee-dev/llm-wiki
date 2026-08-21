# guides-list-remove-eyebrow-label Test Result

## Scope
`/guides` 목록에서 "가이드 문서" 라벨 미노출, 다른 섹션(FAQ/자료실) 회귀 없음 검증.

## Environment
- 로컬 dev 서버(`pnpm dev`), 실제 Confluence 원격 데이터
- 브라우저: Playwright(Chromium)

## Commands
- `pnpm typecheck`
- `pnpm test`
- Playwright MCP로 `/guides` 접속, 목록 항목 접근성 스냅샷 확인

## Results
- PASS: `pnpm typecheck`
- PASS: `pnpm test` (34 files / 208 tests, 회귀 없음)
- PASS: Playwright — `/guides` 목록 71개 항목의 링크 텍스트에 "가이드 문서" 텍스트가 더 이상 포함되지 않음을 스냅샷으로 확인(제목+요약만 노출)

## Failure Notes
없음.

## Retest Results
해당 없음.

## Acceptance Criteria Coverage
- AC1: 충족(Playwright 확인)
- AC2: 충족(FAQ/자료실은 원래도 eyebrow 미사용이라 변화 없음, grep으로 다른 호출부 없음 확인)
