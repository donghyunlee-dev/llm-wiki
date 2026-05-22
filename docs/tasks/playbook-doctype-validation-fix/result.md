# playbook-doctype-validation-fix Result

## Delivered Scope

- `packages/wiki-core/src/lib/wikiDataSource.ts`: `readDocType`에 `"playbook"` 추가 (1줄)
- `packages/wiki-core/src/lib/wikiDataSource.test.ts`: playbook 파싱/제외 회귀 테스트 추가

## Root Cause

`confluenceClient.ts`와 `wikiDataSource.ts` 두 곳에 각각 독립적인 docType 검증 함수가 존재했고, `playbook`이 `confluenceClient.ts`에만 추가된 상태였음. `wikiDataSource.ts`는 remote API 응답을 파싱하는 경로로, 이 검증에서 예외가 나면 전체 데이터 로딩이 실패함.

## Effect

- 5173 (live Confluence): 홈 추천 가이드 4개, /guides 129개, 검색 정상 동작
- playbook 페이지는 기존 다운스트림 필터에 의해 계속 공개 corpus에서 제외됨

## Decisions

- docType 허용값 단일화(Codex Finding 2)는 별도 태스크로 관리

## Gaps

없음.
