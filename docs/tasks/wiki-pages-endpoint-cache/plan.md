# wiki-pages-endpoint-cache Plan

## Summary
- `packages/serverless/src/wikiPagesHandler.ts`에 모듈 스코프 TTL 캐시를 추가한다.
- `aiOrchestration.ts`의 `loadWikiCache`/`fetchAndBuildWikiCache` 패턴(캐시 히트 확인 → in-flight promise 공유 → 캐시 채움)을 이 핸들러 규모에 맞게 단순화해 재사용한다.

## Impacted Modules
- `packages/serverless/src/wikiPagesHandler.ts` (구현)
- `packages/serverless/src/wikiPagesHandler.test.ts` (테스트 추가)
- `docs/prd/implementation-status.md` (진행 기록)

## Architecture Approach
- 캐시는 핸들러 파일 내 모듈 스코프 변수(`let cache`, `let inFlight`)로 둔다 — 별도 인프라나 외부 스토어 없음(아키텍처 Hard Constraint 준수).
- 캐시 키 분리는 하지 않는다(스페이스 고정, 요청 파라미터 없음 — spec.md Assumptions).
- 캐시 대상은 `fetchConfluencePageRecords`가 반환하는 원본 `pages` 배열이다(현재 핸들러가 그대로 응답 바디에 넣는 값과 동일).
- 실패한 fetch는 캐시하지 않는다 — `inFlight` promise가 reject되면 다음 요청이 다시 시도하도록 `finally`에서 in-flight 상태만 정리한다.
- 응답 헤더(`Cache-Control: no-store`)는 그대로 유지한다 — 이번 변경은 서버 프로세스 내부 캐시이지 브라우저/CDN 캐시가 아니다.
- 테스트를 위해 `fetchConfluencePageRecords` 호출 지점을 그대로 두되, 모듈 레벨 캐시 상태를 테스트 간 초기화할 수 있는 방법이 필요하다 — 캐시 리셋 함수를 별도로 export하거나(`__resetWikiPagesCacheForTests`), 테스트가 각기 다른 옵션(`options.fetch`)으로 격리 가능한지 확인 후 최소 침습적인 방식을 선택한다.

## Data And API Impact
- 응답 스키마, 상태 코드, CORS 동작 변경 없음.
- 캐시 히트 시 응답 지연이 Confluence 왕복(7~14초) 없이 즉시(수 ms) 처리됨.

## Validation Plan
- `pnpm --filter @sfood/serverless test` (또는 워크스페이스 전체 `pnpm test`)로 신규 캐시 동작(AC1~AC4) 단위 테스트.
- `pnpm typecheck` 통과 확인.
- 로컬에서 handler를 직접 호출해 캐시 히트 시 지연이 사라지는지 타이밍 로그로 확인(모의 `fetch`에 인위적 지연을 주는 방식).
- 실제 프로덕션(ax-wiki.s-food.ai) 개선 효과 측정은 Lambda 배포가 필요하므로, 배포 여부와 시점은 별도로 사용자 확인을 받는다 — 배포 후 Playwright로 동일한 시나리오(새 질문, 반복 진입)를 재실측해 Before/After를 비교한다.

## Risks
- 캐시가 30분간 유지되는 동안 Confluence 문서가 수정되면, TTL이 끝날 때까지 최신 내용이 반영되지 않는다 — 기존 `aiOrchestration.ts` 캐시도 동일한 트레이드오프를 이미 갖고 있어 새로운 리스크는 아니다.
- 서로 다른 Lambda 컨테이너 인스턴스(콜드스타트/스케일아웃)는 캐시를 공유하지 않아, 실사용 환경에서의 체감 개선폭은 단일 인스턴스 반복 테스트보다 작을 수 있다 — spec.md Edge Cases에 명시.
- 모듈 스코프 캐시를 테스트 간 격리하지 않으면 테스트가 서로 오염될 수 있다 — 리셋 훅으로 방지.

## Rollback Considerations
- 캐시 로직을 제거하고 매 요청 fetch로 되돌리면 즉시 이전 동작으로 복귀 가능(상태 비저장 로직 추가일 뿐, 데이터 마이그레이션 없음).
