# Spec: Confluence 메타데이터 병렬 fetch

## Problem

`fetchConfluencePageRecords()`는 페이지 목록을 가져온 뒤 각 페이지의 메타데이터를 `for...await` 루프로 순차 조회한다.
130개 페이지 기준 약 130+ 번의 API 호출이 직렬 실행되어 초기 로딩 시간의 주된 병목이 된다.

## Scope

- `packages/wiki-core/src/lib/confluenceClient.ts` 의 `fetchConfluencePageRecords` 내부 루프를 청크 기반 병렬 `Promise.all()`로 교체
- 반환 결과 집합과 순서 보장 (null 필터링 동일)
- 기존 동작(메타데이터 없는 페이지 제외, title-fallback 추론)은 그대로 유지

## Out of Scope

- Confluence 클라이언트 바깥의 캐싱 계층 변경
- 테스트 픽스처 추가 이외의 테스트 구조 변경
- `wikiPagesHandler.ts` 등 호출측 수정

## Acceptance Criteria

1. `fetchConfluencePageRecords()` 호출 시 페이지 메타데이터 요청이 청크 단위(최대 20개)로 병렬 실행된다.
2. 기존 테스트 4개 모두 통과한다.
3. 결과 배열의 원소 집합과 순서가 직렬 구현과 동일하다 (페이지 목록 순서 유지).
4. `pnpm test`, `pnpm typecheck`, `pnpm build` 모두 통과한다.
