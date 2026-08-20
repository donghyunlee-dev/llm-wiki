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

## Production Before/After (2026-08-20, ax-wiki.s-food.ai, PR #25 merge 후 배포 완료)

Playwright로 동일 시나리오(홈 진입 반복, `/api/wiki-pages` GET 응답 시간)를 재실측.

| 시나리오 | 배포 전(2026-08-20 최초 조사) | 배포 후 |
|---|---|---|
| 첫 진입(콜드, 캐시 미스) | 14.1초 / 8.9초 | 12.9초 |
| 반복 진입(같은 웜 인스턴스, 캐시 히트) | 7.4~9.2초 (캐시 없어 매번 재수집) | **0.82~0.87초** |

- 콜드 캐시(첫 요청 또는 30분 경과 후 첫 요청, 혹은 다른 Lambda 인스턴스로 라우팅된 경우)는 기존과 동일하게 Confluence 전체 재수집 비용(약 13초)이 든다 — 예상된 동작(spec.md Edge Cases).
- **캐시 히트 시 7~9초 → 1초 미만으로, 홈/검색 화면 재진입 지연이 사실상 제거됨**을 프로덕션에서 확인.
- AI 검색(`ai-search` Lambda) 응답 시간은 이번 변경의 스코프가 아니었고, 실측 결과도 예상대로 무변화(약 31.5초, Stage1+Stage2 순차 OpenAI 호출 구조 그대로) — 사용자가 원래 리포트한 "20초 이상" 체감 지연의 주 원인은 여전히 AI 검색 파이프라인에 남아 있음.

## Open Gaps
- **AI 검색 파이프라인(Stage1 `gpt-5-mini` + Stage2 `o4-mini` 순차 호출)이 여전히 요청당 약 30초** — 이번 스코프(A안, wiki-pages 캐시)는 홈/검색 화면 진입 지연만 해결했고, 질문 답변 자체의 지연은 그대로다. 이전에 제시한 개선안 B(AI 파이프라인 최적화)가 체감 지연 해소에 더 큰 영향을 줄 것으로 보임.
- Lambda 콜드스타트/메모리 설정 확인(D), 캐시 워밍(C)은 이번 스코프 밖으로 남음.

## Next Steps
- 사용자와 개선안 B(AI 검색 2단계 모델 호출 최적화) 착수 여부 논의.
