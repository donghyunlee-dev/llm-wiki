# wiki-pages-endpoint-cache Spec

## Problem Statement
- `GET /api/wiki-pages`(`packages/serverless/src/wikiPagesHandler.ts`)가 요청마다 캐시 없이 `fetchConfluencePageRecords()`를 새로 실행한다.
- 이 함수는 Confluence 페이지 목록을 페이지네이션으로 전부 조회한 뒤, 페이지마다(20개씩 배치) 메타데이터 속성을 추가 조회한다.
- 브라우저는 홈/검색 화면 진입마다 이 엔드포인트를 호출하므로, 실측(Playwright, ax-wiki.s-food.ai) 기준 매 페이지뷰마다 7~14초의 고정 지연이 발생한다.
- `packages/wiki-core/src/lib/aiOrchestration.ts`에는 동일한 데이터에 대해 이미 30분 TTL 메모리 캐시(`loadWikiCache`)가 있지만, ai-ask/ai-search Lambda 내부에서만 쓰이고 `wikiPagesHandler`(별도 Lambda)에는 적용되어 있지 않다.

## Business Context
- `docs/prd/architecture.md`의 MVP Runtime Policy가 "optional in-memory cache keyed by page ID and version"을 이미 허용한다.
- `docs/prd/search-flow-contract.md`도 "검색 캐시는 메모리 기반, 페이지 version 기준 갱신, TTL 만료 시 재적재"를 명시한다.
- 별도 DBMS/RDS 도입은 여전히 금지(아키텍처 Hard Constraint) — 이번 변경은 Lambda 프로세스 내 메모리 캐시로 한정한다.

## Scope
- `wikiPagesHandler`에 모듈 스코프 인메모리 캐시(TTL 기반)를 추가해, TTL 이내 반복 요청은 Confluence를 다시 호출하지 않고 캐시된 `pages`를 반환한다.
- 콜드 캐시 상태에서 동시에 여러 요청이 들어와도 Confluence fetch가 중복 실행되지 않도록 in-flight 요청을 공유한다(`aiOrchestration.ts`의 `wikiCachePromise` 패턴 재사용).
- TTL 값은 기존 `aiOrchestration.ts`의 `WIKI_CACHE_TTL_MS`(30분)와 동일하게 맞춘다.
- 캐시 히트/미스 여부와 무관하게 응답 스키마(`{ pages }`)와 상태 코드는 기존과 동일하게 유지한다.

## Out Of Scope
- ai-ask/ai-search Lambda의 캐시 로직 변경.
- CDN(CloudFront)/브라우저 캐시 헤더 변경(`Cache-Control: no-store` 유지) — Lambda 인스턴스 간 캐시 공유(Redis/DynamoDB 등 외부 스토어) 도입.
- Confluence 업스트림 장애 시 캐시된 stale 데이터를 계속 서빙하는 stale-while-revalidate 동작(요청 시 판단, 이번 스코프에서는 단순 TTL 캐시만 다룸).
- AI 검색 파이프라인(Stage1/Stage2 모델 호출) 최적화, Lambda 메모리/동시성 설정 변경 — 별도 후속 과제.

## User Or Operator Scenarios
- 캐시가 비어있거나 만료된 상태에서 첫 요청이 오면 Confluence를 조회하고 캐시를 채운 뒤 응답한다(기존과 동일한 지연).
- TTL 이내에 같은 Lambda 인스턴스로 후속 요청이 오면 Confluence 호출 없이 즉시 캐시된 데이터를 반환한다.
- 캐시가 비어있는 상태에서 동시에 여러 요청이 들어오면 Confluence fetch는 한 번만 실행되고 모든 요청이 같은 결과를 공유한다.
- Confluence 업스트림이 실패하면 캐시 상태와 무관하게 기존과 동일하게 `502`를 반환한다(캐시에 stale 값이 있어도 이번 스코프에서는 폴백하지 않음).

## Acceptance Criteria
- AC1: TTL 이내 반복 호출 시 `fetchConfluencePageRecords`(또는 주입된 fetch)가 다시 호출되지 않는다.
- AC2: TTL 만료 후 호출 시 `fetchConfluencePageRecords`가 다시 호출되어 최신 데이터로 캐시가 갱신된다.
- AC3: 캐시가 비어있는 상태의 동시 요청은 업스트림 fetch를 한 번만 트리거한다.
- AC4: 캐시 히트 여부와 무관하게 응답 바디(`{ pages }`)와 CORS/에러 처리 동작은 기존과 동일하다.
- AC5: `pnpm test`, `pnpm typecheck` 통과.

## Edge Cases
- 캐시된 fetch가 실패하면(Confluence 502 등) 캐시를 채우지 않고 다음 요청에서 재시도한다(실패 결과를 캐시하지 않음).
- 서로 다른 Lambda 컨테이너 인스턴스는 캐시를 공유하지 않으므로, 콜드스타트 직후 요청은 여전히 느릴 수 있다(이번 스코프의 알려진 한계로 문서화).
- AC3(in-flight 공유)은 표준 AWS Lambda 실행 모델에서 하나의 execution environment가 요청을 한 번에 하나씩 처리한다는 점(동시 invocation은 대개 별도 environment로 분산)을 감안하면, 실제 효과는 "같은 웜 인스턴스가 순차적으로 재사용되는 반복 요청"에서 대부분 발생한다. 동시 요청 dedup은 부가 효과이며 주 개선 효과로 과장하지 않는다(Codex 리뷰, 2026-08-20).

## Assumptions
- 이 엔드포인트가 서비스하는 위키 스페이스는 단일(`CONFLUENCE_SPACE_ID` 고정)이므로 캐시 키를 요청 파라미터별로 분리할 필요는 없다(핸들러가 쿼리 파라미터를 받지 않음, 코드 확인 완료).
- 로컬 dev 서버(Vite `/api/wiki-pages`)는 이번 스코프 대상이 아니다 — 프로덕션 Lambda 핸들러만 다룬다.
