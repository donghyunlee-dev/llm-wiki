# playbook-doctype-validation-fix Plan

## Impacted Areas

| 파일 | 변경 | 내용 |
|---|---|---|
| `packages/wiki-core/src/lib/wikiDataSource.ts` | 수정 | `readDocType`에 `value === "playbook"` 조건 추가 |

## Approach

`wikiDataSource.ts:241`의 `readDocType` 함수에 `"playbook"` 1줄 추가.
파싱 통과 후 기존 `listPublicWikiDocumentsFrom` 필터가 playbook을 가이드/검색에서 계속 제외.

## Validation Plan

1. `pnpm test` → 전체 통과 확인
2. `pnpm typecheck` → 통과 확인
3. Playwright: 5173 홈(추천 가이드), 검색, /guides 목록 확인
4. Codex 비판 리뷰
