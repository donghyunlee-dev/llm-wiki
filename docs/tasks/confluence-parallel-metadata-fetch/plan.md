# Plan: Confluence 메타데이터 병렬 fetch

## Impacted File

- `packages/wiki-core/src/lib/confluenceClient.ts` — `fetchConfluencePageRecords` 함수 내부만 변경

## Approach

`fetchConfluencePageRecords` 안의 순차 루프를 청크 기반 `Promise.all()`로 교체한다.

```
현재:
  for (const page of pages) {
    const metadata = await fetchPageMetadata(...)
    ...records.push(...)
  }

변경 후:
  BATCH_SIZE = 20 개씩 나눠서
  for each batch: await Promise.all(batch.map(page => fetchMetadata + build record))
  null 필터링 후 결과 배열에 누적
```

청크 크기 20은 Confluence Cloud 레이트 리밋(통상 10–20 req/s) 대비 안전한 수준이며,
130페이지를 7청크로 나눠 처리한다 (130 / 20 = 최대 7 라운드).

별도 헬퍼 함수를 도입하지 않고 `fetchConfluencePageRecords` 내에 인라인으로 구현한다.

## Validation Plan

1. `pnpm --filter @sfood/wiki-core test -- src/lib/confluenceClient.test.ts` — 기존 4개 케이스 통과 확인
2. `pnpm typecheck` — 타입 오류 없음 확인
3. `pnpm build` — 빌드 성공 확인
4. `pnpm test` — 전체 테스트 통과 확인

## Risks

- Confluence 레이트 리밋: 청크 크기 20으로 완화. 문제 발생 시 10으로 낮춰도 충분히 빠름.
- 순서 보장: `pages` 배열 순서대로 청크를 처리하고 `Promise.all`은 입력 순서대로 결과를 반환하므로 순서 유지됨.
