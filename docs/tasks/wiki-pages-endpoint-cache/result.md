# wiki-pages-endpoint-cache Result

## Delivered Scope
- `packages/serverless/src/wikiPagesHandler.ts`에 모듈 스코프 TTL(30분) 인메모리 캐시 추가 — `aiOrchestration.ts`의 `loadWikiCache` 패턴(캐시 히트 → in-flight promise 공유 → 캐시 채움, 실패 시 미캐시)을 이 핸들러 규모에 맞춰 적용.
- 캐시가 단일 스페이스(고정 `CONFLUENCE_SPACE_ID`) 배포를 전제한다는 점을 코드 주석으로 명시.
- 테스트 격리를 위한 `__resetWikiPagesCacheForTests()` export 추가.
- 신규 테스트 5건 추가(TTL 히트, TTL 만료+데이터 갱신 확인, 동시 요청 dedup, 실패 시 미캐시, 만료 후 재조회 실패 시 stale 미서빙).
- README에 30분 캐시 동작과 최대 30분 반영 지연을 문서화.

## Changed Files
- `packages/serverless/src/wikiPagesHandler.ts`
- `packages/serverless/src/wikiPagesHandler.test.ts`
- `README.md`
- `docs/tasks/wiki-pages-endpoint-cache/*`

## Key Decisions
- 캐시 키를 두지 않고 단일 슬롯으로 구현 — 이 Lambda가 스페이스당 하나씩 배포되는 현재 아키텍처를 전제(spec.md Assumptions).
- 업스트림 실패 시 stale 데이터를 서빙하지 않고 항상 502를 반환 — stale-while-revalidate는 이번 스코프에서 제외(spec.md Out of Scope).
- Codex 크리티컬 리뷰(2026-08-20) 반영: (1) 동시 요청 dedup 효과가 실제 AWS Lambda 실행 모델(요청당 순차 처리, 동시 invocation은 별도 execution environment로 분산)에서는 "동일 웜 인스턴스의 순차 재사용"이 주 효과이고 동시성 dedup은 부가 효과임을 spec.md에 명시, (2) TTL 만료 테스트가 실제 데이터 갱신까지 검증하도록 강화, (3) 만료된 캐시에서 재조회 실패 시 stale 미서빙을 테스트로 고정, (4) README에 반영 지연 문서화.

## Validation
- `pnpm --filter @sfood/serverless test`, `pnpm test`(전체), `pnpm typecheck`(전체) 모두 통과 — `docs/tasks/wiki-pages-endpoint-cache/test-result.md` 참고.
- 임시 수동 타이밍 테스트(8초 인위 지연 mock)로 캐시 히트 시 지연이 제거됨을 확인 후 삭제(커밋 대상 아님).
- Codex 크리티컬 리뷰 완료, 지적 사항 전부 반영.

## Open Gaps
- **프로덕션 실측(Before/After) 미완료** — 이번 변경은 아직 배포되지 않았다. 사용자가 요청한 "적용하면서 얼마나 줄어드는지 확인"은 `main` 브랜치 배포(`.github/workflows/deploy.yml`의 `deploy-serverless` 잡, `wiki-pages` Lambda 코드 갱신)가 있어야 실제 ax-wiki.s-food.ai에서 재측정할 수 있다. 배포는 프로덕션에 영향을 주는 작업이라 사용자 확인 후 진행 예정.
- 배포 후 Playwright로 이전과 동일한 시나리오(새 세션 첫 진입, 반복 페이지 이동)를 재실측해 `/api/wiki-pages` 응답 시간 Before/After를 비교 기록해야 한다.
- Lambda 콜드스타트/메모리 설정, AI 검색 2단계 모델 호출 최적화(B), 캐시 워밍(C)은 이번 스코프 밖 — 이전 대화에서 제시한 후속 과제로 남음.

## Next Steps
- 사용자에게 배포 진행 여부 확인.
- 승인 시 `main`에 병합/배포 → Playwright로 프로덕션 재실측 → 이 문서에 Before/After 수치 추가.
