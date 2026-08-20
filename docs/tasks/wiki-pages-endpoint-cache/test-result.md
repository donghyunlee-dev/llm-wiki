# wiki-pages-endpoint-cache Test Result

## Commands Executed
- `pnpm --filter @sfood/serverless test` → **PASS** (26 tests, 4 files; `wikiPagesHandler.test.ts` 10 tests including 5 new cache tests)
- `pnpm test` (전체 워크스페이스) → **PASS** (apps/web 33 files/206 tests 포함, 회귀 없음)
- `pnpm typecheck` (전체 워크스페이스) → **PASS**
- 임시 수동 타이밍 검증(커밋 대상 아님, 실행 후 삭제): mock fetch에 8초 인위 지연을 준 상태로 동일 요청 2회 호출 → 1회차 8015ms, 2회차(캐시 히트) 0ms. 캐시가 실제로 지연을 제거함을 확인.

## Acceptance Criteria Coverage
| AC | 내용 | 커버 방식 | 결과 |
|---|---|---|---|
| AC1 | TTL 이내 반복 호출 시 fetch 재실행 안 됨 | `serves a repeated request within the TTL from cache...` | PASS |
| AC2 | TTL 만료 후 재호출 시 최신 데이터로 캐시 갱신 | `refetches from Confluence after the cache TTL expires and serves the refreshed data` (두 응답의 title 차이로 실제 갱신 검증) | PASS |
| AC3 | 콜드 캐시 동시 요청은 fetch 1회만 | `shares a single in-flight Confluence fetch across concurrent cold-cache requests` | PASS (단, 아래 Known Gaps 참고) |
| AC4 | 캐시 히트/미스 모두 응답 바디·상태코드 동일 | 기존 4개 테스트(성공/CORS/405/500) + 위 신규 테스트의 바디 비교 | PASS |
| AC5 | `pnpm test`/`pnpm typecheck` 통과 | 위 커맨드 | PASS |

## Additional Regression Coverage (Codex 리뷰 반영)
- `returns 502 without serving stale data when a post-expiry refetch fails` — 만료된 캐시 상태에서 재조회가 실패하면 stale 데이터를 서빙하지 않고 502를 반환함을 검증.

## Skipped / Not Applicable Checks
- **Playwright(6b) — 프로덕션 대상 시나리오 재검증 보류**: 이번 변경은 `packages/serverless/src/wikiPagesHandler.ts`(백엔드 Lambda)만 수정했고 응답 스키마·UI 컴포넌트는 변경하지 않아 로컬에서 새로 확인할 브라우저 렌더링 경로가 없다. 캐시 효과의 실측(Before/After)은 프로덕션 배포가 필요하므로, 배포 여부를 사용자에게 확인한 뒤 별도로 Playwright 재실측을 진행한다(Open Gap으로 아래 result.md에 기록).
- 로컬 Vite dev 서버(`/api/wiki-pages`)는 spec.md에서 Out of Scope로 명시했으므로 검증 대상에서 제외.

## Retest Outcomes
- 해당 없음(최초 구현, 재테스트 이력 없음).
