# Result: Confluence 메타데이터 병렬 fetch

## Delivered

- `packages/wiki-core/src/lib/confluenceClient.ts`의 `fetchConfluencePageRecords` 내부를 배치 크기 20의 청크 기반 `Promise.all()` 방식으로 교체.
- 기존 직렬 `for...await` 루프 제거.
- 결과 집합·순서·null 필터링 동작은 변경 없음.

## Performance Impact

130페이지 기준으로 기존 130+ 직렬 API 호출이 7라운드(최대 20개 병렬)로 압축된다.
Confluence Cloud 레이트 리밋(통상 10–20 req/s) 이내를 유지하면서 초기화 시간을 수십 초 → 수 초 수준으로 단축한다.

## Decisions

- 청크 크기 20: Confluence 레이트 리밋 안전 마진. 필요 시 10으로 낮춰도 효과 충분.
- 헬퍼 함수 미도입: 단일 사용처이므로 인라인으로 처리.
