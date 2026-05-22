# playbook-doctype-validation-fix Spec

## Problem Statement

`wikiDataSource.ts`의 `readDocType` 검증 함수에 `"playbook"`이 누락되어 있어, Confluence API 응답에 `playbook` docType 페이지가 포함되면 전체 파싱이 실패한다.

- 결과: 5173 (live Confluence 모드) 홈 화면이 "불러오는 중..." 상태로 멈춤
- 가이드 목록 미표시, 검색 불가

`playbook`은 검색 후 결과를 저장하는 전용 로깅 페이지로, 가이드/검색에서는 이미 다운스트림 필터로 제외되도록 정의되어 있다. 문제는 해당 필터가 실행되기 전에 파싱 단계에서 예외가 발생한다는 것이다.

## Scope

- `packages/wiki-core/src/lib/wikiDataSource.ts`: `readDocType`에 `"playbook"` 추가

## Out of Scope

- `confluenceClient.ts` 변경 없음 (이미 `playbook` 포함)
- playbook 필터링 로직 변경 없음 (기존 다운스트림 필터 유지)

## Acceptance Criteria

- AC1: 5173 홈 화면 정상 로드 — 추천 가이드 표시
- AC2: 5173 검색 정상 동작
- AC3: 5173 /guides 가이드 목록 정상 표시
- AC4: `pnpm test` 전체 통과
